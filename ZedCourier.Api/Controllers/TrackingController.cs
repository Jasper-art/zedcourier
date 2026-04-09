using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZedCourier.Api.Data;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrackingController(AppDbContext context)
        {
            _context = context;
        }

        // PUBLIC - No auth required
        // GET api/v1/tracking/{waybill}
        [HttpGet("{waybill}")]
        public async Task<IActionResult> Track(string waybill)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.WaybillNumber == waybill && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Waybill not found. Please check the number and try again." });

            var logs = await _context.TrackingLogs
                .Where(t => t.ParcelId == parcel.Id)
                .OrderBy(t => t.Timestamp)
                .Select(t => new
                {
                    t.NewStatus,
                    t.Notes,
                    t.Timestamp
                })
                .ToListAsync();

            var originBranch = await _context.Branches
                .FirstOrDefaultAsync(b => b.Id == parcel.OriginBranchId);

            var destinationBranch = await _context.Branches
                .FirstOrDefaultAsync(b => b.Id == parcel.DestinationBranchId);

            return Ok(new
            {
                parcelId = parcel.Id,
                waybill = parcel.WaybillNumber,
                status = parcel.Status,
                origin = originBranch?.Name,
                destination = destinationBranch?.Name,
                deliveryLandmark = parcel.DeliveryLandmark,
                createdAt = parcel.CreatedAt,
                timeline = logs
            });
        }
    }
}