namespace ZedCourier.Api.Models
{
    public class NotificationLog
    {
        public Guid Id { get; set; }
        public Guid ParcelId { get; set; }
        public string NotificationType { get; set; } // Email, SMS, WhatsApp
        public string RecipientAddress { get; set; } // Email or Phone
        public string RecipientName { get; set; }
        public string MessageContent { get; set; }
        public string Status { get; set; } // Sent, Failed, Pending
        public DateTime? SentAt { get; set; }
        public string FailureReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        public Parcel Parcel { get; set; }
    }
}