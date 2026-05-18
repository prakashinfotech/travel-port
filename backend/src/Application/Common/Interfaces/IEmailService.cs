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

    Task SendTransportBookingConfirmationAsync(
        string toEmail, string toName, string bookingRef, string transportType,
        string operatorName, string vehicleType,
        string origin, string destination,
        string departureTime, string arrivalTime, string duration,
        int passengers, decimal unitPrice, decimal subtotal, decimal discount,
        string? couponCode, decimal finalAmount,
        string? pickupAddress = null, string? driverName = null, string? cabNumber = null,
        string? companyPhone = null, decimal? driverRating = null,
        string? pnr = null, string? coachNumber = null, string? seatNumbers = null, string? berthType = null,
        string? busNumber = null, string? driverPhone = null,
        string? boardingPoint = null, string? droppingPoint = null,
        CancellationToken ct = default);
}
