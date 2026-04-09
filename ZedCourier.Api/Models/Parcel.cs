using System;
using System.Collections.Generic;

namespace ZedCourier.Api.Models
{
    public class Parcel
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string WaybillNumber { get; set; } = string.Empty;
        public Guid OriginBranchId { get; set; }
        public Guid DestinationBranchId { get; set; }
        public Guid? AssignedDriverId { get; set; }

        // Sender Details
        public string SenderName { get; set; } = string.Empty;
        public string SenderPhone { get; set; } = string.Empty;
        public string SenderEmail { get; set; } = string.Empty;

        // Receiver Details
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string ReceiverEmail { get; set; } = string.Empty;

        // Parcel Details
        public string DeliveryLandmark { get; set; } = string.Empty;
        public decimal WeightKg { get; set; }
        public decimal Cost { get; set; }
        public string ZraInvoiceReference { get; set; } = string.Empty;

        // PIN & Security
        public string CollectionPinHash { get; set; } = string.Empty;
        public string? DeliveryPin { get; set; }
        public bool PinSent { get; set; } = false;
        public DateTime? PinSentAt { get; set; }

        // Status & Tracking
        public string Status { get; set; } = "Recorded";
        public Guid CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }

        // Navigation Properties
        public virtual Branch? OriginBranch { get; set; }
        public virtual Branch? DestinationBranch { get; set; }
        public virtual User? AssignedDriver { get; set; }
        public virtual ICollection<TrackingLog>? TrackingLogs { get; set; }
    }
}