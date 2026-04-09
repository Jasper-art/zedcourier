using Microsoft.EntityFrameworkCore;
using ZedCourier.Api.Models;

namespace ZedCourier.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Parcel> Parcels { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<TrackingLog> TrackingLogs { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }
        public DbSet<NotificationPreference> NotificationPreferences { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure the User -> Branch relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Branch)
                .WithMany()
                .HasForeignKey(u => u.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            // Ensure Email is unique at the database level
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure NotificationLog -> Parcel relationship
            modelBuilder.Entity<NotificationLog>()
                .HasOne(nl => nl.Parcel)
                .WithMany()
                .HasForeignKey(nl => nl.ParcelId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure NotificationPreference -> User relationship
            modelBuilder.Entity<NotificationPreference>()
                .HasOne(np => np.User)
                .WithMany()
                .HasForeignKey(np => np.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for NotificationLog
            modelBuilder.Entity<NotificationLog>()
                .HasIndex(nl => nl.ParcelId);

            modelBuilder.Entity<NotificationLog>()
                .HasIndex(nl => nl.Status);

            modelBuilder.Entity<NotificationLog>()
                .HasIndex(nl => nl.CreatedAt);

            // Indexes for NotificationPreference
            modelBuilder.Entity<NotificationPreference>()
                .HasIndex(np => np.UserId);
        }
    }
}