using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZedCourier.Api.Data;
using ZedCourier.Api.Models;
using ZedCourier.Api.Helpers;

namespace ZedCourier.Api.Services
{
    public class CollectionService
    {
        private readonly AppDbContext _context;

        public CollectionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> ProcessCollectionAsync(string waybillNumber, string inputPin, Guid clerkBranchId, Guid clerkUserId)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.WaybillNumber == waybillNumber && p.DeletedAt == null);

            if (parcel == null)
                return (false, "Parcel not found.");

            if (parcel.Status == "Collected")
                return (false, "Parcel has already been collected.");

            if (parcel.Status != "Arrived")
                return (false, "Parcel is not yet marked as 'Arrived' at the destination.");

            // The Branch Handshake: Ensure clerk is at the right destination branch
            if (parcel.DestinationBranchId != clerkBranchId)
                return (false, "Unauthorized: Parcel must be collected at its designated destination branch.");

            // Secure PIN Verification
            if (!SecurityHelper.VerifyPin(inputPin, parcel.CollectionPinHash))
                return (false, "Invalid Collection PIN.");

            // Update Status
            parcel.Status = "Collected";
            parcel.UpdatedAt = DateTime.UtcNow;

            // Create Immutable Audit Log
            var log = new TrackingLog
            {
                ParcelId = parcel.Id,
                BranchId = clerkBranchId,
                ScannedBy = clerkUserId,
                PreviousStatus = "Arrived",
                NewStatus = "Collected",
                Notes = "Successfully verified PIN and released to client."
            };

            _context.TrackingLogs.Add(log);
            await _context.SaveChangesAsync();

            return (true, "Parcel successfully collected.");
        }
    }
}