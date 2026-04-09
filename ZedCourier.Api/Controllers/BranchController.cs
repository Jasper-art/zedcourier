using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZedCourier.Api.Data;
using ZedCourier.Api.Models;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class BranchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/v1/branch
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var branches = await _context.Branches
                .Where(b => b.IsActive)
                .OrderBy(b => b.Town)
                .ToListAsync();

            return Ok(branches);
        }

        // GET api/v1/branch/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var branch = await _context.Branches
                .FirstOrDefaultAsync(b => b.Id == id && b.IsActive);

            if (branch == null)
                return NotFound(new { error = "Branch not found." });

            return Ok(branch);
        }

        // POST api/v1/branch
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Branch branch)
        {
            if (string.IsNullOrWhiteSpace(branch.Name) || string.IsNullOrWhiteSpace(branch.Town))
                return BadRequest(new { error = "Branch Name and Town are required." });

            branch.Id = Guid.NewGuid();
            branch.CreatedAt = DateTime.UtcNow;
            branch.IsActive = true;

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = branch.Id }, branch);
        }

        // PUT api/v1/branch/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Branch updated)
        {
            var branch = await _context.Branches.FindAsync(id);

            if (branch == null || !branch.IsActive)
                return NotFound(new { error = "Branch not found." });

            branch.Name = updated.Name;
            branch.Town = updated.Town;
            branch.Province = updated.Province;

            await _context.SaveChangesAsync();

            return Ok(branch);
        }

        // DELETE api/v1/branch/{id}  (soft deactivate)
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Deactivate(Guid id)
        {
            var branch = await _context.Branches.FindAsync(id);

            if (branch == null || !branch.IsActive)
                return NotFound(new { error = "Branch not found." });

            branch.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Branch '{branch.Name}' deactivated." });
        }
    }
}