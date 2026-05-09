using TravelPort.Domain.Enums;

namespace TravelPort.Application.DTOs.Bookings;

public record BookingDto(
    Guid Id,
    string BookingReference,
    string Type,
    BookingStatus Status,
    decimal TotalAmount,
    decimal DiscountAmount,
    DateTime BookingDate,
    Guid? FlightId,
    Guid? HotelId,
    int? Passengers,
    string? CheckIn,
    string? CheckOut,
    string? CouponCode
);

public record BookingCreatedResponse(
    Guid Id,
    string BookingReference,
    decimal TotalAmount,
    BookingStatus Status
);

public record CancelBookingResponse(Guid BookingId, decimal RefundAmount);
