using ZedCourier.Api.Models;
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
                    new Branch { Id = Guid.NewGuid(), Name = "Sinda Main Branch",    Town = "Sinda",    Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Katete Main Branch",   Town = "Katete",   Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Petauke Main Branch",  Town = "Petauke",  Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Chipata Main Branch",  Town = "Chipata",  Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Lundazi Main Branch",  Town = "Lundazi",  Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Chadiza Main Branch",  Town = "Chadiza",  Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Nyimba Main Branch",   Town = "Nyimba",   Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Mambwe Main Branch",   Town = "Mambwe",   Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Branch { Id = Guid.NewGuid(), Name = "Vubwi Main Branch",    Town = "Vubwi",    Province = "Eastern", IsActive = true, CreatedAt = DateTime.UtcNow },
                };
                context.Branches.AddRange(branches);
                context.SaveChanges();
            }

            // 2. Seed Admin User
            if (!context.Users.Any())
            {
                var chipata = context.Branches.FirstOrDefault(b => b.Town == "Chipata");

                context.Users.Add(new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "Super Admin",
                    Email = "admin@zedcourier.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                    Role = "Admin",
                    BranchId = chipata?.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    WhatsAppNumber = "0000000000"
                });

                context.SaveChanges();
            }

            // 3. Migrate any SHA256 passwords to BCrypt
            var usersToMigrate = context.Users.ToList();
            foreach (var user in usersToMigrate)
            {
                if (user.PasswordHash.Length == 64)
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234");
            }
            context.SaveChanges();
        }
    }
}