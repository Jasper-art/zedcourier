namespace ZedCourier.Api.Models
{
    public class SendPinRequest
    {
        public bool SendEmail { get; set; } = true;
        public bool SendSms { get; set; } = false;
        public bool SendWhatsapp { get; set; } = false;
    }
}