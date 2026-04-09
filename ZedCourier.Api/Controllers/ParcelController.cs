using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZedCourier.Api.Data;
using ZedCourier.Api.Helpers;
using ZedCourier.Api.Models;
using ZedCourier.Api.Services;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ParcelController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;
        private readonly IWhatsAppService _whatsAppService;
        private readonly ILogger<ParcelController> _logger;

        public ParcelController(
            AppDbContext context,
            IConfiguration config,
            IEmailService emailService,
            ISmsService smsService,
            IWhatsAppService whatsAppService,
            ILogger<ParcelController> logger)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
            _smsService = smsService;
            _whatsAppService = whatsAppService;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet("ping")]
        public IActionResult Ping() =>
            Ok(new { message = "Backend connection successful! ZedCourier API is live." });

        // GET api/v1/parcel
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var parcels = await _context.Parcels
                .Where(p => p.DeletedAt == null)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.WaybillNumber,
                    p.Status,
                    p.SenderName,
                    p.SenderPhone,
                    p.SenderEmail,
                    p.ReceiverName,
                    p.ReceiverPhone,
                    p.ReceiverEmail,
                    p.OriginBranchId,
                    p.DestinationBranchId,
                    p.DeliveryLandmark,
                    p.WeightKg,
                    p.Cost,
                    p.DeliveryPin,
                    p.PinSent,
                    p.PinSentAt,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(parcels);
        }

        // GET api/v1/parcel/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Parcel not found." });

            var logs = await _context.TrackingLogs
                .Where(t => t.ParcelId == id)
                .OrderBy(t => t.Timestamp)
                .ToListAsync();

            return Ok(new { parcel, logs });
        }

        // POST api/v1/parcel
        [HttpPost]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> Create([FromBody] CreateParcelRequest request)
        {
            var clerkIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(clerkIdClaim)) return Unauthorized();
            var clerkId = Guid.Parse(clerkIdClaim);

            string rawPin = SecurityHelper.GeneratePin();

            var parcel = new Parcel
            {
                Id = Guid.NewGuid(),
                WaybillNumber = $"ZP-{DateTime.Now.Year}-{new Random().Next(1000, 9999)}",
                SenderName = request.SenderName,
                SenderPhone = request.SenderPhone,
                SenderEmail = request.SenderEmail ?? string.Empty,
                ReceiverName = request.ReceiverName,
                ReceiverPhone = request.ReceiverPhone,
                ReceiverEmail = request.ReceiverEmail ?? string.Empty,
                OriginBranchId = request.OriginBranchId,
                DestinationBranchId = request.DestinationBranchId,
                DeliveryLandmark = request.DeliveryLandmark,
                WeightKg = request.WeightKg,
                Cost = request.Cost,
                CollectionPinHash = SecurityHelper.HashPin(rawPin),
                DeliveryPin = rawPin,
                Status = "Recorded",
                CreatedBy = clerkId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PinSent = false
            };

            _context.Parcels.Add(parcel);

            _context.TrackingLogs.Add(new TrackingLog
            {
                ParcelId = parcel.Id,
                BranchId = parcel.OriginBranchId,
                ScannedBy = clerkId,
                PreviousStatus = "",
                NewStatus = "Recorded",
                Notes = "Parcel recorded at origin branch.",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Send creation notification email (optional)
            if (!string.IsNullOrEmpty(parcel.ReceiverEmail))
            {
                _ = _emailService.SendWelcomeEmailAsync(parcel.ReceiverEmail, parcel.ReceiverName);
            }

            return Ok(new
            {
                message = "Parcel created successfully.",
                waybill = parcel.WaybillNumber,
                pinForClient = rawPin
            });
        }

        // POST api/v1/parcel/{id}/regenerate-pin
        [HttpPost("{id:guid}/regenerate-pin")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> RegeneratePin(Guid id)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Parcel not found." });

            if (parcel.Status == "Collected")
                return BadRequest(new { error = "Parcel already collected. Cannot regenerate PIN." });

            var clerkId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            string rawPin = SecurityHelper.GeneratePin();
            parcel.DeliveryPin = rawPin;
            parcel.CollectionPinHash = SecurityHelper.HashPin(rawPin);
            parcel.UpdatedAt = DateTime.UtcNow;

            _context.TrackingLogs.Add(new TrackingLog
            {
                ParcelId = parcel.Id,
                BranchId = parcel.DestinationBranchId,
                ScannedBy = clerkId,
                PreviousStatus = parcel.Status,
                NewStatus = parcel.Status,
                Notes = "Collection PIN regenerated by clerk.",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "New PIN generated successfully.",
                pin = rawPin,
                waybill = parcel.WaybillNumber
            });
        }

        // POST api/v1/parcel/{id}/send-delivery-pin
        [HttpPost("{id:guid}/send-delivery-pin")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> SendDeliveryPin(Guid id, [FromBody] SendPinRequest request)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Parcel not found." });

            // Generate fresh PIN
            string rawPin = SecurityHelper.GeneratePin();
            parcel.DeliveryPin = rawPin;
            parcel.CollectionPinHash = SecurityHelper.HashPin(rawPin);
            parcel.PinSent = true;
            parcel.PinSentAt = DateTime.UtcNow;
            parcel.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var notificationResults = new { email = false, sms = false, whatsapp = false };

            // Send email with PIN
            if (request.SendEmail && !string.IsNullOrEmpty(parcel.ReceiverEmail))
            {
                var emailSent = await _emailService.SendDeliveryPinEmailAsync(
                    parcel.ReceiverEmail,
                    parcel.ReceiverName,
                    parcel.WaybillNumber,
                    rawPin,
                    parcel.DeliveryLandmark
                );
                notificationResults = new { email = emailSent, sms = notificationResults.sms, whatsapp = notificationResults.whatsapp };
            }

            // Send SMS with PIN
            if (request.SendSms && !string.IsNullOrEmpty(parcel.ReceiverPhone))
            {
                var smsSent = await _smsService.SendDeliveryNotificationAsync(
                    parcel.ReceiverPhone,
                    parcel.WaybillNumber,
                    rawPin,
                    parcel.DeliveryLandmark
                );
                notificationResults = new { email = notificationResults.email, sms = smsSent, whatsapp = notificationResults.whatsapp };
            }

            // Send WhatsApp with PIN
            if (request.SendWhatsapp && !string.IsNullOrEmpty(parcel.ReceiverPhone))
            {
                var whatsappSent = await _whatsAppService.SendDeliveryNotificationAsync(
                    parcel.ReceiverPhone,
                    parcel.WaybillNumber,
                    rawPin,
                    parcel.DeliveryLandmark
                );
                notificationResults = new { email = notificationResults.email, sms = notificationResults.sms, whatsapp = whatsappSent };
            }

            _logger.LogInformation($"Delivery PIN sent for parcel {parcel.WaybillNumber}");

            return Ok(new
            {
                message = "Delivery PIN sent successfully.",
                pin = rawPin,
                waybill = parcel.WaybillNumber,
                notificationResults
            });
        }

        // PUT api/v1/parcel/{id}/status
        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "Clerk,Driver,Admin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] StatusUpdateRequest request)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Parcel not found." });

            // Validate PIN if provided (for delivery verification)
            if (!string.IsNullOrEmpty(request.DeliveryPin))
            {
                if (parcel.DeliveryPin != request.DeliveryPin)
                    return BadRequest(new { error = "Invalid delivery PIN." });
            }

            var clerkId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
            var branchId = Guid.Parse(User.FindFirstValue("branchId") ?? Guid.Empty.ToString());

            var previous = parcel.Status;
            parcel.Status = request.NewStatus;
            parcel.UpdatedAt = DateTime.UtcNow;

            _context.TrackingLogs.Add(new TrackingLog
            {
                ParcelId = parcel.Id,
                BranchId = branchId,
                ScannedBy = clerkId,
                PreviousStatus = previous,
                NewStatus = request.NewStatus,
                Notes = request.Notes ?? $"Status updated to {request.NewStatus}.",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Send status update notifications if requested
            if (request.NotifySender && !string.IsNullOrEmpty(parcel.SenderPhone))
            {
                _ = _whatsAppService.SendStatusUpdateAsync(
                    parcel.SenderPhone,
                    parcel.WaybillNumber,
                    request.NewStatus,
                    request.Notes ?? "Status updated"
                );
            }

            _logger.LogInformation($"Status updated for parcel {parcel.WaybillNumber} to {request.NewStatus}");

            return Ok(new
            {
                message = "Status updated.",
                waybill = parcel.WaybillNumber,
                status = parcel.Status,
                previousStatus = previous
            });
        }

        // DELETE api/v1/parcel/{id} — soft delete
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDelete(Guid id)
        {
            var parcel = await _context.Parcels
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (parcel == null)
                return NotFound(new { error = "Parcel not found." });

            parcel.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Parcel {parcel.WaybillNumber} soft deleted");

            return Ok(new { message = $"Parcel {parcel.WaybillNumber} soft deleted." });
        }
    }

    // ── Request DTOs ────────────────────────────────────────────────────
    public class CreateParcelRequest
    {
        public string SenderName { get; set; } = string.Empty;
        public string SenderPhone { get; set; } = string.Empty;
        public string? SenderEmail { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string? ReceiverEmail { get; set; }
        public Guid OriginBranchId { get; set; }
        public Guid DestinationBranchId { get; set; }
        public string DeliveryLandmark { get; set; } = string.Empty;
        public decimal WeightKg { get; set; }
        public decimal Cost { get; set; }
    }

    public class StatusUpdateRequest
    {
        public string NewStatus { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? DeliveryPin { get; set; }
        public bool NotifySender { get; set; } = false;
    }

    public class SendPinRequest
    {
        public bool SendEmail { get; set; } = true;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }
}