namespace ZedCourier.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendReceiptEmailAsync(string recipientEmail, string recipientName, string waybill, string collectDate);
        Task<bool> SendSenderNotificationEmailAsync(string senderEmail, string waybill, string receiverName, string collectDate);
        Task<bool> SendDeliveryPinEmailAsync(string recipientEmail, string recipientName, string waybill, string pin, string landmark);
        Task<bool> SendWelcomeEmailAsync(string email, string name);
    }
}