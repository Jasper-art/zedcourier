namespace ZedCourier.Api.Services
{
    public interface IWhatsAppService
    {
        Task<bool> SendDeliveryNotificationAsync(string recipientPhone, string waybill, string pin, string landmark);
        Task<bool> SendCollectionNotificationAsync(string senderPhone, string waybill, string receiverName, string collectDate);
        Task<bool> SendStatusUpdateAsync(string phone, string waybill, string status, string details);
    }
}