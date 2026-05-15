namespace TravelPort.Application.DTOs.HotelManager;

public record RegisterHotelRequest(
    string HotelName,
    string City,
    string Address,
    decimal StarRating,
    string ManagerEmail,
    string ManagerPassword,
    string ManagerName
);

public record HotelManagerDashboardDto(
    int TotalBookings,
    int ActiveBookings,
    int CancelledBookings,
    decimal TotalRevenue,
    int TotalRooms,
    int ActiveRooms,
    decimal AvgReviewScore,
    int ReviewCount
);

public record HotelManagerBookingDto(
    Guid Id,
    string BookingRef,
    string RoomType,
    string GuestName,
    string GuestEmail,
    string? GuestPhone,
    DateTime CheckIn,
    DateTime CheckOut,
    int Nights,
    int Guests,
    decimal Amount,
    string Status,
    DateTime BookedAt
);

public record CreateRoomRequest(
    string RoomType,
    decimal PricePerNight,
    int MaxGuests,
    int TotalRooms,
    string? Amenities,
    string? Images
);

public record UpdateRoomRequest(
    string? RoomType,
    decimal? PricePerNight,
    int? MaxGuests,
    int? TotalRooms,
    string? Amenities,
    string? Images,
    bool? IsActive
);

public record UpdateHotelDetailsRequest(
    string? Name,
    string? Address,
    string? City,
    decimal? StarRating,
    string? Description,
    string? Amenities,
    string? ImageUrl,
    string? Images
);

public record AdminHotelListDto(
    Guid Id,
    string Name,
    string City,
    string? Address,
    decimal StarRating,
    decimal ReviewScore,
    int ReviewCount,
    bool IsActive,
    int RoomCount,
    string? ManagerEmail,
    DateTime CreatedAt
);

public record HotelRoomManagerDto(
    Guid Id,
    string RoomType,
    decimal PricePerNight,
    int MaxGuests,
    int TotalRooms,
    string? Amenities,
    string? Images,
    bool IsActive
);

public record HotelProfileDto(
    Guid Id,
    string Name,
    string City,
    string? Address,
    decimal StarRating,
    decimal ReviewScore,
    int ReviewCount,
    string? Description,
    string? Amenities,
    string? ImageUrl,
    string? Images,
    bool IsActive,
    List<HotelRoomManagerDto> Rooms
);
