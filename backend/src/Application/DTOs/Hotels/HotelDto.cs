namespace TravelPort.Application.DTOs.Hotels;

public record HotelDto(
    Guid Id,
    string Name,
    string City,
    string Address,
    decimal StarRating,
    decimal ReviewScore,
    int ReviewCount,
    string Description,
    string Amenities,
    string ImageUrl,
    string? Images,
    List<HotelRoomDto> Rooms,
    List<HotelReviewDto>? Reviews = null,
    string? ExternalHotelId = null,
    double? Latitude = null,
    double? Longitude = null
);

public record HotelRoomDto(
    Guid Id,
    string RoomType,
    decimal PricePerNight,
    int MaxOccupancy,
    int AvailableRooms,
    string Amenities,
    string? CancellationPolicy = null,
    string? MealPlan = null,
    bool IsRefundable = false,
    string? ExternalOfferId = null,
    string? Images = null
);
