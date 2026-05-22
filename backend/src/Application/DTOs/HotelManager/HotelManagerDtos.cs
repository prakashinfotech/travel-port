namespace TravelPort.Application.DTOs.HotelManager;

// ── Hotel Operations DTOs ────────────────────────────────────────────────────

public record CheckInRequest(string RoomNumber, string? Notes);

public record AddHotelChargeRequest(
    string ItemName,
    string Category,
    int Quantity,
    decimal Price,
    decimal Tax,
    string? Notes
);

public record CheckOutRequest(string PaymentMethod, string? Notes);

public record HotelBookingChargeDto(
    Guid Id,
    string ItemName,
    string Category,
    int Quantity,
    decimal Price,
    decimal Tax,
    string? Notes,
    DateTime AddedAt
);

public record HotelBookingDetailDto(
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
    DateTime BookedAt,
    string? RoomNumber,
    DateTime? CheckInTime,
    DateTime? ActualCheckOutTime,
    string? CheckInNotes,
    string? PaymentMethod,
    bool IsPaymentPaid,
    string PaymentStatus,
    List<HotelBookingChargeDto> Charges
);

public record HotelInvoiceDto(
    Guid BookingId,
    string BookingRef,
    string InvoiceNumber,
    string HotelName,
    string HotelCity,
    string? HotelAddress,
    decimal StarRating,
    string GuestName,
    string GuestEmail,
    string? GuestPhone,
    string RoomType,
    string? RoomNumber,
    DateTime CheckIn,
    DateTime CheckOut,
    int Nights,
    int Guests,
    decimal PricePerNight,
    decimal RoomTotal,
    bool IsRoomPrepaid,
    List<HotelBookingChargeDto> Charges,
    decimal ChargesSubTotal,
    decimal ChargesTax,
    decimal GrandTotal,
    decimal AlreadyPaid,
    decimal AmountDue,
    string? PaymentMethod,
    DateTime GeneratedAt
);

public record RoomAvailabilityDto(
    Guid RoomId,
    string RoomType,
    int TotalRooms,
    int BookedRooms,
    int AvailableRooms,
    decimal PricePerNight,
    int MaxGuests
);

// ── Existing DTOs ─────────────────────────────────────────────────────────────

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
