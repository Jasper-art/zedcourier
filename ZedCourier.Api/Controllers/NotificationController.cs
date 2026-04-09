using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZedCourier.Api.Services;

namespace ZedCourier.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;
        private readonly IWhatsAppService _whatsAppService;
        private readonly IConfiguration _config;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            IEmailService emailService,
            ISmsService smsService,
            IWhatsAppService whatsAppService,
            IConfiguration config,
            ILogger<NotificationController> logger)
        {
            _emailService = emailService;
            _smsService = smsService;
            _whatsAppService = whatsAppService;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Send collection receipt to recipient
        /// </summary>
        [HttpPost("send-receipt")]
        [Authorize(Roles = "Clerk,Driver,Admin")]
        public async Task<IActionResult> SendReceipt([FromBody] SendReceiptRequest request)
        {
            if (string.IsNullOrEmpty(request.RecipientEmail) && string.IsNullOrEmpty(request.RecipientPhone))
                return BadRequest(new { error = "Either email or phone number is required." });

            try
            {
                var results = new
                {
                    email = new { sent = false, message = "" },
                    sms = new { sent = false, message = "" },
                    whatsapp = new { sent = false, message = "" }
                };

                // Send email receipt
                if (!string.IsNullOrEmpty(request.RecipientEmail))
                {
                    var emailSent = await _emailService.SendReceiptEmailAsync(
                        request.RecipientEmail,
                        request.RecipientName,
                        request.Waybill,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = new { sent = emailSent, message = emailSent ? "Email sent successfully" : "Failed to send email" },
                        sms = results.sms,
                        whatsapp = results.whatsapp
                    };
                }

                // Send SMS receipt
                if (!string.IsNullOrEmpty(request.RecipientPhone) && request.SendSms)
                {
                    var smsSent = await _smsService.SendCollectionNotificationAsync(
                        request.RecipientPhone,
                        request.Waybill,
                        request.RecipientName,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = results.email,
                        sms = new { sent = smsSent, message = smsSent ? "SMS sent successfully" : "Failed to send SMS" },
                        whatsapp = results.whatsapp
                    };
                }

                // Send WhatsApp receipt
                if (!string.IsNullOrEmpty(request.RecipientPhone) && request.SendWhatsapp)
                {
                    var whatsappSent = await _whatsAppService.SendCollectionNotificationAsync(
                        request.RecipientPhone,
                        request.Waybill,
                        request.RecipientName,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = results.email,
                        sms = results.sms,
                        whatsapp = new { sent = whatsappSent, message = whatsappSent ? "WhatsApp sent successfully" : "Failed to send WhatsApp" }
                    };
                }

                _logger.LogInformation($"Receipt notification sent for waybill {request.Waybill}");
                return Ok(new
                {
                    message = "Receipt notification(s) sent.",
                    waybill = request.Waybill,
                    results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending receipt: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Send notification to sender when parcel is collected
        /// </summary>
        [HttpPost("notify-sender")]
        [Authorize(Roles = "Clerk,Driver,Admin")]
        public async Task<IActionResult> NotifySender([FromBody] NotifySenderRequest request)
        {
            if (string.IsNullOrEmpty(request.SenderEmail) && string.IsNullOrEmpty(request.SenderPhone))
                return BadRequest(new { error = "Either sender email or phone number is required." });

            try
            {
                var results = new
                {
                    email = new { sent = false, message = "" },
                    sms = new { sent = false, message = "" },
                    whatsapp = new { sent = false, message = "" }
                };

                // Send email notification
                if (!string.IsNullOrEmpty(request.SenderEmail))
                {
                    var emailSent = await _emailService.SendSenderNotificationEmailAsync(
                        request.SenderEmail,
                        request.Waybill,
                        request.ReceiverName,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = new { sent = emailSent, message = emailSent ? "Email sent successfully" : "Failed to send email" },
                        sms = results.sms,
                        whatsapp = results.whatsapp
                    };
                }

                // Send SMS notification
                if (!string.IsNullOrEmpty(request.SenderPhone) && request.SendSms)
                {
                    var smsSent = await _smsService.SendCollectionNotificationAsync(
                        request.SenderPhone,
                        request.Waybill,
                        request.ReceiverName,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = results.email,
                        sms = new { sent = smsSent, message = smsSent ? "SMS sent successfully" : "Failed to send SMS" },
                        whatsapp = results.whatsapp
                    };
                }

                // Send WhatsApp notification
                if (!string.IsNullOrEmpty(request.SenderPhone) && request.SendWhatsapp)
                {
                    var whatsappSent = await _whatsAppService.SendCollectionNotificationAsync(
                        request.SenderPhone,
                        request.Waybill,
                        request.ReceiverName,
                        request.CollectDate
                    );
                    results = new
                    {
                        email = results.email,
                        sms = results.sms,
                        whatsapp = new { sent = whatsappSent, message = whatsappSent ? "WhatsApp sent successfully" : "Failed to send WhatsApp" }
                    };
                }

                _logger.LogInformation($"Sender notification sent for waybill {request.Waybill}");
                return Ok(new
                {
                    message = "Sender notification(s) sent.",
                    waybill = request.Waybill,
                    results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending sender notification: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Send delivery PIN notification to recipient
        /// </summary>
        [HttpPost("send-delivery-pin")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> SendDeliveryPin([FromBody] SendDeliveryPinRequest request)
        {
            if (string.IsNullOrEmpty(request.RecipientEmail) && string.IsNullOrEmpty(request.RecipientPhone))
                return BadRequest(new { error = "Either email or phone number is required." });

            try
            {
                var results = new
                {
                    email = new { sent = false, message = "" },
                    sms = new { sent = false, message = "" },
                    whatsapp = new { sent = false, message = "" }
                };

                // Send email with PIN
                if (!string.IsNullOrEmpty(request.RecipientEmail))
                {
                    var emailSent = await _emailService.SendDeliveryPinEmailAsync(
                        request.RecipientEmail,
                        request.RecipientName,
                        request.Waybill,
                        request.DeliveryPin,
                        request.Landmark
                    );
                    results = new
                    {
                        email = new { sent = emailSent, message = emailSent ? "Email sent successfully" : "Failed to send email" },
                        sms = results.sms,
                        whatsapp = results.whatsapp
                    };
                }

                // Send SMS with PIN
                if (!string.IsNullOrEmpty(request.RecipientPhone) && request.SendSms)
                {
                    var smsSent = await _smsService.SendDeliveryNotificationAsync(
                        request.RecipientPhone,
                        request.Waybill,
                        request.DeliveryPin,
                        request.Landmark
                    );
                    results = new
                    {
                        email = results.email,
                        sms = new { sent = smsSent, message = smsSent ? "SMS sent successfully" : "Failed to send SMS" },
                        whatsapp = results.whatsapp
                    };
                }

                // Send WhatsApp with PIN
                if (!string.IsNullOrEmpty(request.RecipientPhone) && request.SendWhatsapp)
                {
                    var whatsappSent = await _whatsAppService.SendDeliveryNotificationAsync(
                        request.RecipientPhone,
                        request.Waybill,
                        request.DeliveryPin,
                        request.Landmark
                    );
                    results = new
                    {
                        email = results.email,
                        sms = results.sms,
                        whatsapp = new { sent = whatsappSent, message = whatsappSent ? "WhatsApp sent successfully" : "Failed to send WhatsApp" }
                    };
                }

                _logger.LogInformation($"Delivery PIN notification sent for waybill {request.Waybill}");
                return Ok(new
                {
                    message = "Delivery PIN notification(s) sent.",
                    waybill = request.Waybill,
                    results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending delivery PIN: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Send status update notification
        /// </summary>
        [HttpPost("send-status-update")]
        [Authorize(Roles = "Clerk,Driver,Admin")]
        public async Task<IActionResult> SendStatusUpdate([FromBody] SendStatusUpdateRequest request)
        {
            if (string.IsNullOrEmpty(request.RecipientPhone))
                return BadRequest(new { error = "Recipient phone number is required." });

            try
            {
                var results = new
                {
                    sms = new { sent = false, message = "" },
                    whatsapp = new { sent = false, message = "" }
                };

                // Send SMS status update
                if (request.SendSms)
                {
                    var smsSent = await _smsService.SendVerificationCodeAsync(
                        request.RecipientPhone,
                        $"Status: {request.Status}"
                    );
                    results = new
                    {
                        sms = new { sent = smsSent, message = smsSent ? "SMS sent successfully" : "Failed to send SMS" },
                        whatsapp = results.whatsapp
                    };
                }

                // Send WhatsApp status update
                if (request.SendWhatsapp)
                {
                    var whatsappSent = await _whatsAppService.SendStatusUpdateAsync(
                        request.RecipientPhone,
                        request.Waybill,
                        request.Status,
                        request.Details
                    );
                    results = new
                    {
                        sms = results.sms,
                        whatsapp = new { sent = whatsappSent, message = whatsappSent ? "WhatsApp sent successfully" : "Failed to send WhatsApp" }
                    };
                }

                _logger.LogInformation($"Status update sent for waybill {request.Waybill}");
                return Ok(new
                {
                    message = "Status update notification(s) sent.",
                    waybill = request.Waybill,
                    results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending status update: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // ── Request DTOs ────────────────────────────────────────────────────

    public class SendReceiptRequest
    {
        public string RecipientEmail { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string RecipientPhone { get; set; } = string.Empty;
        public string Waybill { get; set; } = string.Empty;
        public string CollectDate { get; set; } = string.Empty;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }

    public class NotifySenderRequest
    {
        public string? SenderEmail { get; set; }
        public string? SenderPhone { get; set; }
        public string Waybill { get; set; } = string.Empty;
        public string ReceiverName { get; set; } = string.Empty;
        public string CollectDate { get; set; } = string.Empty;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }

    public class SendDeliveryPinRequest
    {
        public string RecipientEmail { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string RecipientPhone { get; set; } = string.Empty;
        public string Waybill { get; set; } = string.Empty;
        public string DeliveryPin { get; set; } = string.Empty;
        public string Landmark { get; set; } = string.Empty;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }

    public class SendStatusUpdateRequest
    {
        public string RecipientPhone { get; set; } = string.Empty;
        public string Waybill { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }
}