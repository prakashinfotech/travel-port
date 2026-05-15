namespace TravelPort.Application.Common.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }

    Task SendFlightBookingConfirmationAsync(
        string toEmail, string toName, string bookingRef,
        string airline, string flightNumber,
        string origin, string originCity,
        string destination, string destinationCity,
        string departureTime, string arrivalTime, string duration,
        string cabinClass, int passengers,
        decimal unitPrice, decimal subtotal, decimal discount, string? couponCode, decimal finalAmount,
        CancellationToken ct = default);

    Task SendHotelBookingConfirmationAsync(
        string toEmail, string toName, string bookingRef,
        string hotelName, string hotelAddress, string city, decimal starRating,
        string roomType, string checkIn, string checkOut, int nights, int guests,
        string? guestName, string? guestPhone,
        decimal pricePerNight, decimal roomTotal, decimal discount, string? couponCode, decimal finalAmount,
        CancellationToken ct = default);

    Task SendBookingCancellationAsync(string toEmail, string toName, string bookingRef,
        string bookingType, decimal refundAmount, CancellationToken ct = default);

    Task SendPasswordResetAsync(string toEmail, string toName, string resetLink, CancellationToken ct = default);

    Task SendHotelCredentialsEmailAsync(
        string toEmail, string toName,
        string hotelName, string loginEmail, string password,
        CancellationToken ct = default);
}
