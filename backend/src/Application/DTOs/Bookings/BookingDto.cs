using TravelPort.Domain.Enums;

namespace TravelPort.Application.DTOs.Bookings;

public record BookingDto(
    Guid Id,
    string BookingReference,
    string Type,
    BookingStatus Status,
    decimal TotalAmount,
    decimal FinalAmount,
    decimal DiscountAmount,
    DateTime BookingDate,
    Guid? FlightId,
    Guid? HotelId,
    int? Passengers,
    string? CheckIn,
    string? CheckOut,
    string? CouponCode,
    string? UserName = null,
    string? UserEmail = null,
    string? UserPhone = null,
    // Flight fields
    string? Airline = null,
    string? FlightNumber = null,
    string? Origin = null,
    string? OriginCity = null,
    string? Destination = null,
    string? DestinationCity = null,
    DateTime? DepartureTime = null,
    DateTime? ArrivalTime = null,
    int? DurationMinutes = null,
    // Hotel fields
    string? HotelName = null,
    string? HotelAddress = null,
    string? HotelCity = null,
    decimal? HotelStars = null,
    string? RoomType = null,
    decimal? PricePerNight = null,
    int? NightsCount = null,
    // Transport fields (Bus / Train / Cab)
    string? TransportOperator = null,
    string? TransportVehicleType = null,
    string? TransportAmenities = null,
    double? TransportDistanceKm = null
);

public record BookingCreatedResponse(
    Guid Id,
    string BookingReference,
    decimal TotalAmount,
    BookingStatus Status
);

public record CancelBookingResponse(Guid BookingId, decimal RefundAmount);
