using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZedCourier.Api.Data;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "Admin")]
    public class FinanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FinanceController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/v1/finance/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var parcels = await _context.Parcels
                .Where(p => p.DeletedAt == null)
                .ToListAsync();

            var totalRevenue = parcels.Sum(p => p.Cost);
            var totalParcels = parcels.Count;
            var collected = parcels.Count(p => p.Status == "Collected");
            var inTransit = parcels.Count(p => p.Status == "InTransit");
            var recorded = parcels.Count(p => p.Status == "Recorded");
            var arrived = parcels.Count(p => p.Status == "Arrived");

            return Ok(new
            {
                totalRevenue,
                totalParcels,
                byStatus = new
                {
                    recorded,
                    inTransit,
                    arrived,
                    collected
                }
            });
        }

        // GET api/v1/finance/daily
        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyRevenue()
        {
            var daily = await _context.Parcels
                .Where(p => p.DeletedAt == null && p.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                .GroupBy(p => p.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key,
                    revenue = g.Sum(p => p.Cost),
                    parcels = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(daily);
        }

        // GET api/v1/finance/branch
        [HttpGet("branch")]
        public async Task<IActionResult> GetRevenueByBranch()
        {
            var byBranch = await _context.Parcels
                .Where(p => p.DeletedAt == null)
                .GroupBy(p => p.OriginBranchId)
                .Select(g => new
                {
                    branchId = g.Key,
                    revenue = g.Sum(p => p.Cost),
                    parcels = g.Count()
                })
                .ToListAsync();

            var branches = await _context.Branches.ToListAsync();

            var result = byBranch.Select(b => new
            {
                branchName = branches.FirstOrDefault(br => br.Id == b.branchId)?.Name ?? "Unknown",
                b.revenue,
                b.parcels
            });

            return Ok(result);
        }

        // GET api/v1/finance/audit
        [HttpGet("audit")]
        public async Task<IActionResult> GetAuditLog()
        {
            var logs = await _context.TrackingLogs
                .OrderByDescending(t => t.Timestamp)
                .Take(200)
                .Select(t => new
                {
                    t.ParcelId,
                    t.PreviousStatus,
                    t.NewStatus,
                    t.Notes,
                    t.Timestamp,
                    t.ScannedBy,
                    t.BranchId
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}