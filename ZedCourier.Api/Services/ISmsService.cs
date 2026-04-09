namespace ZedCourier.Api.Services
{
    public interface ISmsService
    {
        Task<bool> SendDeliveryNotificationAsync(string recipientPhone, string waybill, string pin, string landmark);
        Task<bool> SendCollectionNotificationAsync(string senderPhone, string waybill, string receiverName, string collectDate);
        Task<bool> SendVerificationCodeAsync(string phone, string code);
    }
}