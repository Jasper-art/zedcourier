using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace ZedCourier.Api.Services
{
    public class SmsService : ISmsService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmsService> _logger;

        public SmsService(IConfiguration config, ILogger<SmsService> logger)
        {
            _config = config;
            _logger = logger;

            var accountSid = _config["Sms:TwilioAccountSid"];
            var authToken = _config["Sms:TwilioAuthToken"];
            TwilioClient.Init(accountSid, authToken);
        }

        public async Task<bool> SendDeliveryNotificationAsync(string recipientPhone, string waybill, string pin, string landmark)
        {
            try
            {
                // Format phone number - ensure it starts with + and country code
                var formattedPhone = FormatPhoneNumber(recipientPhone);
                var fromNumber = _config["Sms:TwilioPhoneNumber"];

                var message = $"ZedCourier: Your parcel {waybill} is ready for collection. PIN: {pin}. Collect at: {landmark}";

                if (message.Length > 160)
                {
                    message = $"ZedCourier: Parcel {waybill} ready. PIN: {pin}. Location: {landmark}";
                }

                var result = await MessageResource.CreateAsync(
                    to: new PhoneNumber(formattedPhone),
                    from: new PhoneNumber(fromNumber),
                    body: message
                );

                _logger.LogInformation($"SMS sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending SMS to {recipientPhone}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendCollectionNotificationAsync(string senderPhone, string waybill, string receiverName, string collectDate)
        {
            try
            {
                var formattedPhone = FormatPhoneNumber(senderPhone);
                var fromNumber = _config["Sms:TwilioPhoneNumber"];

                var message = $"ZedCourier: Your parcel {waybill} has been collected by {receiverName} on {collectDate}";

                if (message.Length > 160)
                {
                    message = $"ZedCourier: Parcel {waybill} collected by {receiverName}. Date: {collectDate}";
                }

                var result = await MessageResource.CreateAsync(
                    to: new PhoneNumber(formattedPhone),
                    from: new PhoneNumber(fromNumber),
                    body: message
                );

                _logger.LogInformation($"Collection SMS sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending collection SMS to {senderPhone}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string phone, string code)
        {
            try
            {
                var formattedPhone = FormatPhoneNumber(phone);
                var fromNumber = _config["Sms:TwilioPhoneNumber"];

                var message = $"ZedCourier: Your verification code is {code}. Valid for 10 minutes.";

                var result = await MessageResource.CreateAsync(
                    to: new PhoneNumber(formattedPhone),
                    from: new PhoneNumber(fromNumber),
                    body: message
                );

                _logger.LogInformation($"Verification code SMS sent to {formattedPhone}. Message SID: {result.Sid}");
                return !string.IsNullOrEmpty(result.Sid);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending verification SMS to {phone}: {ex.Message}");
                return false;
            }
        }

        private string FormatPhoneNumber(string phone)
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

            return cleaned;
        }
    }
}