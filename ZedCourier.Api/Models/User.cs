using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZedCourier.Api.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "Clerk";

        public Guid? BranchId { get; set; }

        [ForeignKey("BranchId")]
        public Branch? Branch { get; set; }

        // Backing field for DateOfBirth to handle UTC conversion
        private DateTime? _dateOfBirth;
        public DateTime? DateOfBirth
        {
            get => _dateOfBirth;
            set => _dateOfBirth = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
        }

        public string WhatsAppNumber { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Backing field for CreatedAt to handle UTC conversion
        private DateTime _createdAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        public DateTime CreatedAt
        {
            get => _createdAt;
            set => _createdAt = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }
    }
}