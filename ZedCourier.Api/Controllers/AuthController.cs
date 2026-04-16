using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ZedCourier.Api.Data;
using ZedCourier.Api.Models;
using ZedCourier.Api.Services;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest(new { error = "Email and password are required." });

                var user = await _context.Users
      .Include(u => u.Branch)
      .FirstOrDefaultAsync(u =>
          u.Email == request.Email.ToLower().Trim() &&
          u.IsActive);

                if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                    return Unauthorized(new { error = "Invalid email or password." });

                if (user == null)
                    return Unauthorized(new { error = "Invalid email or password." });

                var token = GenerateJwt(user);

                return Ok(new
                {
                    token,
                    user = new
                    {
                        user.Id,
                        user.FullName,
                        user.Email,
                        user.Role,
                        user.BranchId,
                        BranchName = user.Branch?.Name
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred during login.", details = ex.Message });
            }
        }

        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { error = "Invalid request data.", details = ModelState });

                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
                    return BadRequest(new { error = "FullName, Email, and Password are required." });

                var normalizedEmail = request.Email.Trim().ToLower();

                if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
                    return BadRequest(new { error = "Email already exists." });

                // Ensure BranchId is valid if provided, otherwise set to null or handle accordingly
                Guid? finalBranchId = request.BranchId;
                if (finalBranchId == Guid.Empty) finalBranchId = null;

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = request.FullName.Trim(),
                    Email = normalizedEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Role = string.IsNullOrWhiteSpace(request.Role) ? "Clerk" : request.Role,
                    BranchId = finalBranchId,
                    DateOfBirth = request.DateOfBirth,
                    WhatsAppNumber = request.WhatsAppNumber?.Trim() ?? string.Empty,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"User {user.FullName} created successfully.", userId = user.Id });
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { error = "Database constraints violated.", details = innerMessage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Server error during registration.", details = ex.Message });
            }
        }

        [HttpPut("{id}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(Guid id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) return NotFound(new { error = "User not found." });

                user.IsActive = false;
                await _context.SaveChangesAsync();
                return Ok(new { message = $"{user.FullName} deactivated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error during deactivation.", details = ex.Message });
            }
        }

        [HttpPut("{id}/reset-password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NewPassword))
                    return BadRequest(new { error = "NewPassword is required." });

                var user = await _context.Users.FindAsync(id);
                if (user == null) return NotFound(new { error = "User not found." });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Password reset successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error during password reset.", details = ex.Message });
            }
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Branch)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        u.Role,
                        u.BranchId,
                        BranchName = u.Branch != null ? u.Branch.Name : "No Branch",
                        u.WhatsAppNumber,
                        u.DateOfBirth,
                        u.IsActive
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error retrieving users.", details = ex.Message });
            }
        }

        private string GenerateJwt(User user)
        {
            var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing in configuration.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName)
            };

            if (user.BranchId.HasValue)
                claims.Add(new Claim("branchId", user.BranchId.ToString()!));

            var expiry = double.TryParse(_config["Jwt:ExpiryHours"], out var hours) ? hours : 24;

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiry),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            if (!string.IsNullOrEmpty(token))
                TokenBlacklistService.RevokeToken(token);
            return Ok(new { message = "Logged out successfully." });
        }
        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }

    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }
        public Guid? BranchId { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? WhatsAppNumber { get; set; }
    }

    public class ResetPasswordRequest { public string NewPassword { get; set; } = string.Empty; }
    public class LoginRequest { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
}