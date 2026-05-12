namespace TravelPort.Application.Common.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }
    Task SendBookingConfirmationAsync(string toEmail, string toName, string bookingRef,
        string details, CancellationToken ct = default);
    Task SendBookingCancellationAsync(string toEmail, string toName, string bookingRef,
        string bookingType, decimal refundAmount, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string toName, string resetLink, CancellationToken ct = default);
}
