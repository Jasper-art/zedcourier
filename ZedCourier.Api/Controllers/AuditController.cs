using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZedCourier.Api.Data;
using ZedCourier.Api.Models;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLogs()
        {
            try
            {
                var logs = await _context.TrackingLogs
                    .Include(t => t.Branch)
                    .Include(t => t.ScannedByUser)
                    .OrderByDescending(t => t.Timestamp)
                    .Select(t => new
                    {
                        t.Id,
                        t.ParcelId,
                        BranchName = t.Branch != null ? t.Branch.Name : "System",
                        User = t.ScannedByUser != null ? t.ScannedByUser.FullName : "System",
                        t.PreviousStatus,
                        t.NewStatus,
                        ActionType = DetermineActionType(t.PreviousStatus, t.NewStatus),
                        t.Notes,
                        t.Timestamp
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error retrieving audit logs.", details = ex.Message });
            }
        }

        [HttpGet("{parcelId:guid}")]
        public async Task<IActionResult> GetParcelLogs(Guid parcelId)
        {
            try
            {
                var logs = await _context.TrackingLogs
                    .Where(t => t.ParcelId == parcelId)
                    .Include(t => t.Branch)
                    .Include(t => t.ScannedByUser)
                    .OrderBy(t => t.Timestamp)
                    .Select(t => new
                    {
                        t.Id,
                        BranchName = t.Branch != null ? t.Branch.Name : "System",
                        User = t.ScannedByUser != null ? t.ScannedByUser.FullName : "System",
                        t.PreviousStatus,
                        t.NewStatus,
                        ActionType = DetermineActionType(t.PreviousStatus, t.NewStatus),
                        t.Notes,
                        t.Timestamp
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error retrieving parcel logs.", details = ex.Message });
            }
        }

        private static string DetermineActionType(string previousStatus, string newStatus)
        {
            if (string.IsNullOrEmpty(previousStatus))
                return "Create";
            if (previousStatus == newStatus)
                return "Update";
            return "Status Change";
        }
    }
}