using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;

namespace TravelPort.Infrastructure.ExternalProviders.Email;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public bool IsConfigured =>
        _settings.Enabled &&
        !string.IsNullOrWhiteSpace(_settings.SmtpHost) &&
        !string.IsNullOrWhiteSpace(_settings.FromEmail);

    public SmtpEmailService(IOptions<EmailSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendBookingConfirmationAsync(string toEmail, string toName, string bookingRef, string details, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped (SMTP not configured) — booking confirmation for {Email} / {BookingRef}", toEmail, bookingRef);
            return;
        }

        var html = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px">
              <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
                <div style="background:#2563eb;color:#fff;padding:24px 28px">
                  <h1 style="margin:0;font-size:28px">TravelPort</h1>
                  <p style="margin:8px 0 0;opacity:.92">Your booking is confirmed</p>
                </div>
                <div style="padding:28px">
                  <p>Hi <strong>{WebUtility.HtmlEncode(toName)}</strong>,</p>
                  <p>Your booking reference is <strong>{WebUtility.HtmlEncode(bookingRef)}</strong>.</p>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0">
                    <pre style="margin:0;font-family:Arial,sans-serif;white-space:pre-wrap;color:#334155">{WebUtility.HtmlEncode(details)}</pre>
                  </div>
                  <p>You can view your booking and download your e-ticket from the TravelPort bookings page.</p>
                </div>
              </div>
            </body>
            </html>
            """;

        await SendAsync(toEmail, toName, $"Booking Confirmed - {bookingRef}", html, ct);
    }

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetLink, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped (SMTP not configured) — reset link: {Link}", resetLink);
            return;
        }

        var html = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px">
              <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
                <div style="background:#2563eb;color:#fff;padding:24px 28px">
                  <h1 style="margin:0;font-size:28px">TravelPort</h1>
                </div>
                <div style="padding:28px">
                  <p>Hi <strong>{WebUtility.HtmlEncode(toName)}</strong>,</p>
                  <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                  <p style="margin:24px 0">
                    <a href="{WebUtility.HtmlEncode(resetLink)}" style="background:#2563eb;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Reset Password</a>
                  </p>
                  <p>If you did not request this, you can ignore this email.</p>
                </div>
              </div>
            </body>
            </html>
            """;

        await SendAsync(toEmail, toName, "Reset Your TravelPort Password", html, ct);
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlContent, CancellationToken ct)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = subject,
            Body = htmlContent,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail, toName));

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = string.IsNullOrWhiteSpace(_settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(_settings.Username, _settings.Password)
        };

        try
        {
            ct.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP email send failed");
        }
    }
}
