using ZedCourier.Api.Models;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace ZedCourier.Api.Data
{
    public static class SeedData
    {
        public static void Seed(AppDbContext context)
        {
            // 1. Seed Branches first
            if (!context.Branches.Any())
            {
                var branches = new List<Branch>
                {
                    new Branch { Id = Guid.NewGuid(), Name = "Sinda Main Branch",   Town = "Sinda",   Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Katete Main Branch",  Town = "Katete",  Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Petauke Main Branch", Town = "Petauke", Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Chipata Main Branch", Town = "Chipata", Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                };
                context.Branches.AddRange(branches);
                context.SaveChanges();
            }

            // 2. Seed Admin User
            if (!context.Users.Any())
            {
                // Find Chipata branch to link the admin to it
                var chipata = context.Branches.FirstOrDefault(b => b.Town == "Chipata");

                context.Users.Add(new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Super Admin",
                    Email = "admin@zedcourier.com",
                    PasswordHash = HashPassword("Admin@1234"), // Must match AuthController hashing
                    Role = "Admin",
                    BranchId = chipata?.Id, // Using the safe navigation operator
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    WhatsAppNumber = "0000000000"
                });

                context.SaveChanges();
            }
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            // Using ToHexString to match the updated AuthController implementation
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}