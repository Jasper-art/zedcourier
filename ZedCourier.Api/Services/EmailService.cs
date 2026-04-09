using SendGrid;
using SendGrid.Helpers.Mail;

namespace ZedCourier.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly SendGridClient _sendGridClient;
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
            var apiKey = _config["Email:SendGridApiKey"];
            _sendGridClient = new SendGridClient(apiKey);
        }

        public async Task<bool> SendReceiptEmailAsync(string recipientEmail, string recipientName, string waybill, string collectDate)
        {
            try
            {
                var html = $@"
                    <html>
                    <head>
                        <style>
                            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }}
                            .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                            .header {{ background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%); color: white; padding: 30px; text-align: center; }}
                            .header h1 {{ font-size: 28px; margin-bottom: 5px; }}
                            .header p {{ font-size: 14px; opacity: 0.9; }}
                            .content {{ padding: 30px; }}
                            .greeting {{ font-size: 16px; color: #333; margin-bottom: 20px; }}
                            .section {{ margin: 20px 0; }}
                            .section-title {{ font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }}
                            .section-value {{ font-size: 18px; color: #000; font-weight: 500; }}
                            .status-badge {{ display: inline-block; background: #4caf50; color: white; padding: 8px 16px; border-radius: 4px; margin-top: 10px; font-weight: 600; }}
                            .divider {{ border-top: 1px solid #eee; margin: 20px 0; }}
                            .footer {{ background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }}
                            .footer p {{ margin: 5px 0; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>ZedCourier Pro</h1>
                                <p>Collection Receipt</p>
                            </div>
                            <div class='content'>
                                <div class='greeting'>
                                    <p>Hello {recipientName},</p>
                                    <p style='margin-top: 10px; color: #666;'>Your parcel has been successfully collected. Please find the details below.</p>
                                </div>
                                <div class='divider'></div>
                                <div class='section'>
                                    <div class='section-title'>Waybill Number</div>
                                    <div class='section-value'>{waybill}</div>
                                </div>
                                <div class='section'>
                                    <div class='section-title'>Collection Date & Time</div>
                                    <div class='section-value'>{collectDate}</div>
                                </div>
                                <div class='section'>
                                    <div class='section-title'>Status</div>
                                    <div class='status-badge'>✓ COLLECTED</div>
                                </div>
                                <div class='divider'></div>
                                <p style='color: #999; font-size: 13px; line-height: 1.6;'>
                                    This is an automated receipt from ZedCourier Pro. Please retain this email for your records. 
                                    If you have any questions, please contact our support team.
                                </p>
                            </div>
                            <div class='footer'>
                                <p><strong>ZedCourier Pro © 2026</strong></p>
                                <p>Eastern Province Logistics | Lusaka, Zambia</p>
                                <p>support@zedcourier.com | +260 97 xxx xxxx</p>
                            </div>
                        </div>
                    </body>
                    </html>";

                var from = new EmailAddress(_config["Email:SenderEmail"], _config["Email:SenderName"]);
                var to = new EmailAddress(recipientEmail, recipientName);
                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = $"ZedCourier Collection Receipt - {waybill}",
                    HtmlContent = html
                };
                msg.AddTo(to);

                var response = await _sendGridClient.SendEmailAsync(msg);
                _logger.LogInformation($"Receipt email sent to {recipientEmail}. Status: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending receipt email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendSenderNotificationEmailAsync(string senderEmail, string waybill, string receiverName, string collectDate)
        {
            try
            {
                var html = $@"
                    <html>
                    <head>
                        <style>
                            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }}
                            .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                            .header {{ background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%); color: white; padding: 30px; text-align: center; }}
                            .header h1 {{ font-size: 28px; margin-bottom: 5px; }}
                            .content {{ padding: 30px; }}
                            .greeting {{ font-size: 16px; color: #333; margin-bottom: 20px; }}
                            .highlight {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                            .highlight-item {{ margin: 8px 0; font-size: 14px; }}
                            .highlight-label {{ color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
                            .highlight-value {{ color: #000; font-size: 16px; font-weight: 500; margin-top: 3px; }}
                            .footer {{ background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Parcel Collected!</h1>
                                <p>Delivery Confirmation</p>
                            </div>
                            <div class='content'>
                                <div class='greeting'>
                                    <p>Hello,</p>
                                    <p style='margin-top: 10px; color: #666;'>We're pleased to inform you that your parcel has been successfully collected.</p>
                                </div>
                                <div class='highlight'>
                                    <div class='highlight-item'>
                                        <div class='highlight-label'>Waybill</div>
                                        <div class='highlight-value'>{waybill}</div>
                                    </div>
                                    <div class='highlight-item'>
                                        <div class='highlight-label'>Collected By</div>
                                        <div class='highlight-value'>{receiverName}</div>
                                    </div>
                                    <div class='highlight-item'>
                                        <div class='highlight-label'>Collection Date & Time</div>
                                        <div class='highlight-value'>{collectDate}</div>
                                    </div>
                                </div>
                                <p style='color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;'>
                                    Thank you for choosing ZedCourier Pro for your logistics needs. We appreciate your business!
                                </p>
                            </div>
                            <div class='footer'>
                                <p><strong>ZedCourier Pro © 2026</strong></p>
                                <p>Eastern Province Logistics | Lusaka, Zambia</p>
                                <p>support@zedcourier.com | +260 97 xxx xxxx</p>
                            </div>
                        </div>
                    </body>
                    </html>";

                var from = new EmailAddress(_config["Email:SenderEmail"], _config["Email:SenderName"]);
                var to = new EmailAddress(senderEmail);
                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = $"Parcel Collected - {waybill}",
                    HtmlContent = html
                };
                msg.AddTo(to);

                var response = await _sendGridClient.SendEmailAsync(msg);
                _logger.LogInformation($"Sender notification email sent to {senderEmail}. Status: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending sender notification email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendDeliveryPinEmailAsync(string recipientEmail, string recipientName, string waybill, string pin, string landmark)
        {
            try
            {
                var html = $@"
                    <html>
                    <head>
                        <style>
                            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }}
                            .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                            .header {{ background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%); color: white; padding: 30px; text-align: center; }}
                            .header h1 {{ font-size: 28px; margin-bottom: 5px; }}
                            .content {{ padding: 30px; }}
                            .greeting {{ font-size: 16px; color: #333; margin-bottom: 20px; }}
                            .pin-box {{ background: #f0f7ff; border: 2px solid #4fc3f7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
                            .pin-label {{ color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }}
                            .pin-value {{ font-size: 32px; font-weight: 700; color: #4fc3f7; letter-spacing: 2px; font-family: 'Courier New', monospace; }}
                            .landmark {{ background: #f9f9f9; padding: 15px; border-left: 4px solid #4fc3f7; margin: 20px 0; }}
                            .landmark-label {{ color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
                            .landmark-value {{ color: #000; font-size: 15px; font-weight: 500; margin-top: 5px; }}
                            .warning {{ color: #d32f2f; font-size: 12px; margin-top: 15px; font-weight: 500; }}
                            .footer {{ background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Your Parcel is Ready!</h1>
                                <p>Collection PIN</p>
                            </div>
                            <div class='content'>
                                <div class='greeting'>
                                    <p>Hello {recipientName},</p>
                                    <p style='margin-top: 10px; color: #666;'>Your ZedCourier parcel is ready for collection at the location below.</p>
                                </div>
                                <div class='pin-box'>
                                    <div class='pin-label'>Your Collection PIN</div>
                                    <div class='pin-value'>{pin}</div>
                                    <div class='warning'>⚠ Keep this PIN confidential</div>
                                </div>
                                <div class='landmark'>
                                    <div class='landmark-label'>Collection Location</div>
                                    <div class='landmark-value'>{landmark}</div>
                                </div>
                                <div style='background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0;'>
                                    <p style='color: #2e7d32; font-size: 14px; margin: 0;'>
                                        <strong>✓ Waybill:</strong> {waybill}
                                    </p>
                                </div>
                                <p style='color: #666; font-size: 13px; line-height: 1.6; margin-top: 20px;'>
                                    If you don't recognize this parcel or have any questions, please contact our support team immediately.
                                </p>
                            </div>
                            <div class='footer'>
                                <p><strong>ZedCourier Pro © 2026</strong></p>
                                <p>Eastern Province Logistics | Lusaka, Zambia</p>
                                <p>support@zedcourier.com | +260 97 xxx xxxx</p>
                            </div>
                        </div>
                    </body>
                    </html>";

                var from = new EmailAddress(_config["Email:SenderEmail"], _config["Email:SenderName"]);
                var to = new EmailAddress(recipientEmail, recipientName);
                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = $"Your ZedCourier PIN - {waybill}",
                    HtmlContent = html
                };
                msg.AddTo(to);

                var response = await _sendGridClient.SendEmailAsync(msg);
                _logger.LogInformation($"Delivery PIN email sent to {recipientEmail}. Status: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending delivery PIN email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string name)
        {
            try
            {
                var html = $@"
                    <html>
                    <head>
                        <style>
                            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }}
                            .container {{ max-width: 600px; margin: 0 auto; background: white; }}
                            .header {{ background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%); color: white; padding: 30px; text-align: center; }}
                            .header h1 {{ font-size: 28px; margin-bottom: 5px; }}
                            .content {{ padding: 30px; }}
                            .greeting {{ font-size: 16px; color: #333; margin-bottom: 20px; }}
                            .footer {{ background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Welcome to ZedCourier Pro!</h1>
                            </div>
                            <div class='content'>
                                <div class='greeting'>
                                    <p>Hello {name},</p>
                                    <p style='margin-top: 10px; color: #666;'>Welcome to ZedCourier Pro! We're excited to have you on board. Your account has been successfully created.</p>
                                    <p style='margin-top: 15px; color: #666;'>You can now manage your parcels, track shipments, and send notifications to recipients. Our team is here to support you every step of the way.</p>
                                </div>
                            </div>
                            <div class='footer'>
                                <p><strong>ZedCourier Pro © 2026</strong></p>
                                <p>Eastern Province Logistics | Lusaka, Zambia</p>
                                <p>support@zedcourier.com | +260 97 xxx xxxx</p>
                            </div>
                        </div>
                    </body>
                    </html>";

                var from = new EmailAddress(_config["Email:SenderEmail"], _config["Email:SenderName"]);
                var to = new EmailAddress(email, name);
                var msg = new SendGridMessage()
                {
                    From = from,
                    Subject = "Welcome to ZedCourier Pro!",
                    HtmlContent = html
                };
                msg.AddTo(to);

                var response = await _sendGridClient.SendEmailAsync(msg);
                _logger.LogInformation($"Welcome email sent to {email}. Status: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending welcome email: {ex.Message}");
                return false;
            }
        }
    }
}