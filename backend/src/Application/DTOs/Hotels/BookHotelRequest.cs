namespace TravelPort.Application.DTOs.Hotels;

public record BookHotelRequest(
    Guid HotelId,
    Guid RoomId,
    DateTime CheckIn,
    DateTime CheckOut,
    int Guests,
    string? CouponCode = null,
    bool UseWallet = false
);
