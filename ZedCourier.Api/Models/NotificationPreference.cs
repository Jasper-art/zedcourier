namespace ZedCourier.Api.Models
{
    public class NotificationPreference
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public bool EmailNotifications { get; set; } = true;
        public bool SmsNotifications { get; set; } = false;
        public bool WhatsAppNotifications { get; set; } = false;
        public bool NotifyOnCreation { get; set; } = true;
        public bool NotifyOnStatusChange { get; set; } = true;
        public bool NotifyOnCollection { get; set; } = true;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        public User User { get; set; }
    }
}