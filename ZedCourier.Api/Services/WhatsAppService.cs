using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace ZedCourier.Api.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<WhatsAppService> _logger;

        public WhatsAppService(IConfiguration config, ILogger<WhatsAppService> logger)
        {
            _config = config;
            _logger = logger;

            var accountSid = _config["WhatsApp:TwilioAccountSid"];
            var authToken = _config["WhatsApp:TwilioAuthToken"];
            TwilioClient.Init(accountSid, authToken);
        }

        public async Task<bool> SendDeliveryNotificationAsync(string recipientPhone, string waybill, string pin, string landmark)
        {
            try
            {
                var formattedPhone = FormatWhatsAppNumber(recipientPhone);
                var fromNumber = _config["WhatsApp:TwilioWhatsAppNumber"];

                var message = $@"🚚 *ZedCourier - Parcel Ready*

Your parcel is ready for collection!

*Waybill:* {waybill}
*PIN:* `{pin}`
*Location:* {landmark}

Please keep your PIN confidential. Share it only with the person collecting the parcel.

Thank you for using ZedCourier Pro! 📦";

                var result = await MessageResource.CreateAsync(
                    to: formattedPhone,
                    from: fromNumber,
                    body: message
                );

                _logger.LogInformation($"WhatsApp message sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending WhatsApp message to {recipientPhone}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendCollectionNotificationAsync(string senderPhone, string waybill, string receiverName, string collectDate)
        {
            try
            {
                var formattedPhone = FormatWhatsAppNumber(senderPhone);
                var fromNumber = _config["WhatsApp:TwilioWhatsAppNumber"];

                var message = $@"✅ *Parcel Collected*

Your parcel has been successfully collected!

*Waybill:* {waybill}
*Collected By:* {receiverName}
*Date & Time:* {collectDate}

Thank you for using ZedCourier Pro! 📦";

                var result = await MessageResource.CreateAsync(
                    to: formattedPhone,
                    from: fromNumber,
                    body: message
                );

                _logger.LogInformation($"WhatsApp collection notification sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending WhatsApp collection notification to {senderPhone}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendStatusUpdateAsync(string phone, string waybill, string status, string details)
        {
            try
            {
                var formattedPhone = FormatWhatsAppNumber(phone);
                var fromNumber = _config["WhatsApp:TwilioWhatsAppNumber"];

                var statusEmoji = status switch
                {
                    "Recorded" => "📝",
                    "In Transit" => "🚚",
                    "At Destination" => "📍",
                    "Ready for Collection" => "📦",
                    "Collected" => "✅",
                    "Cancelled" => "❌",
                    _ => "ℹ️"
                };

                var message = $@"{statusEmoji} *Parcel Status Update*

*Waybill:* {waybill}
*Status:* {status}
*Details:* {details}

Track your parcel anytime on our platform. 🔗

ZedCourier Pro © 2026";

                var result = await MessageResource.CreateAsync(
                    to: formattedPhone,
                    from: fromNumber,
                    body: message
                );

                _logger.LogInformation($"WhatsApp status update sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending WhatsApp status update to {phone}: {ex.Message}");
                return false;
            }
        }

        private string FormatWhatsAppNumber(string phone)
        {
            // Remove any non-digit characters except +
            var cleaned = System.Text.RegularExpressions.Regex.Replace(phone, @"[^\d+]", "");

            // If no country code, assume +260 (Zambia)
            if (!cleaned.StartsWith("+"))
            {
                if (cleaned.StartsWith("0"))
                    cleaned = cleaned.Substring(1);
                cleaned = "+260" + cleaned;
            }

            // WhatsApp format: whatsapp:+country_code_number
            return $"whatsapp:{cleaned}";
        }
    }
}