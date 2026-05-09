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
    List<HotelRoomDto> Rooms
);

public record HotelRoomDto(
    Guid Id,
    string RoomType,
    decimal PricePerNight,
    int MaxOccupancy,
    int AvailableRooms,
    string Amenities
);
