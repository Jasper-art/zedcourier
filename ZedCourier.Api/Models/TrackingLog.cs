using System;
using ZedCourier.Api.Models;

namespace ZedCourier.Api.Models
{
    public class TrackingLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ParcelId { get; set; }
        public Guid BranchId { get; set; }
        public Guid ScannedBy { get; set; }
        public string PreviousStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Parcel? Parcel { get; set; }
        public Branch? Branch { get; set; }
        public User? ScannedByUser { get; set; }
    }
}