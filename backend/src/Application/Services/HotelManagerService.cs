using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class HotelManagerService : IHotelManagerService
{
    private readonly IHotelRepository _hotels;
    private readonly IHotelRoomRepository _rooms;
    private readonly IBookingRepository _bookings;
    private readonly IUnitOfWork _uow;

    public HotelManagerService(
        IHotelRepository hotels,
        IHotelRoomRepository rooms,
        IBookingRepository bookings,
        IUnitOfWork uow)
    {
        _hotels   = hotels;
        _rooms    = rooms;
        _bookings = bookings;
        _uow      = uow;
    }

    public async Task<HotelManagerDashboardDto> GetDashboardAsync(Guid hotelId, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        var allBookings = await _bookings.FindAsync(
            b => b.BookingType == BookingType.Hotel && b.ReferenceId == hotelId, ct);

        var revenue     = allBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var active      = allBookings.Count(b => b.Status is BookingStatus.Confirmed or BookingStatus.Pending);
        var cancelled   = allBookings.Count(b => b.Status == BookingStatus.Cancelled);
        var totalRooms  = hotel.Rooms.Count;
        var activeRooms = hotel.Rooms.Count(r => r.IsActive);

        return new HotelManagerDashboardDto(
            allBookings.Count,
            active,
            cancelled,
            revenue,
            totalRooms,
            activeRooms,
            hotel.ReviewScore,
            hotel.ReviewCount
        );
    }

    public async Task<(List<HotelManagerBookingDto> Items, int Total)> GetBookingsAsync(
        Guid hotelId, int page, int pageSize, string? status, CancellationToken ct = default)
    {
        var (items, total) = await _bookings.GetHotelBookingsPagedAsync(hotelId, page, pageSize, status, ct);

        var dtos = items.Select(b => new HotelManagerBookingDto(
            b.Id,
            b.BookingRef,
            "Hotel Stay",
            b.GuestName ?? "—",
            b.GuestEmail ?? "—",
            b.GuestPhone,
            b.CheckIn ?? DateTime.MinValue,
            b.CheckOut ?? DateTime.MinValue,
            b.CheckIn.HasValue && b.CheckOut.HasValue
                ? Math.Max(1, (b.CheckOut.Value - b.CheckIn.Value).Days)
                : 0,
            b.Passengers ?? 1,
            b.FinalAmount,
            b.Status.ToString(),
            b.CreatedAt
        )).ToList();

        return (dtos, total);
    }

    public async Task<HotelProfileDto> GetHotelProfileAsync(Guid hotelId, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);
        return ToProfileDto(hotel);
    }

    public async Task<HotelProfileDto> UpdateHotelDetailsAsync(Guid hotelId, UpdateHotelDetailsRequest req, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetWithAllRoomsAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        if (req.Name is not null)        hotel.Name        = req.Name;
        if (req.Address is not null)     hotel.Address     = req.Address;
        if (req.City is not null)        hotel.City        = req.City;
        if (req.StarRating.HasValue)     hotel.StarRating  = req.StarRating.Value;
        if (req.Description is not null) hotel.Description = req.Description;
        if (req.Amenities is not null)   hotel.Amenities   = req.Amenities;
        if (req.ImageUrl is not null)    hotel.ImageUrl    = req.ImageUrl;
        if (req.Images is not null)      hotel.Images      = req.Images;

        await _hotels.UpdateAsync(hotel, ct);
        await _uow.SaveChangesAsync(ct);
        return ToProfileDto(hotel);
    }

    public async Task<HotelRoomManagerDto> AddRoomAsync(Guid hotelId, CreateRoomRequest req, CancellationToken ct = default)
    {
        var exists = await _hotels.ExistsAsync(h => h.Id == hotelId, ct);
        if (!exists) throw new NotFoundException("Hotel", hotelId);

        var room = new HotelRoom
        {
            Id            = Guid.NewGuid(),
            HotelId       = hotelId,
            RoomType      = req.RoomType,
            PricePerNight = req.PricePerNight,
            MaxGuests     = req.MaxGuests,
            TotalRooms    = req.TotalRooms,
            Amenities     = req.Amenities,
            Images        = req.Images,
            IsActive      = true
        };

        await _rooms.AddAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
        return ToRoomDto(room);
    }

    public async Task<HotelRoomManagerDto> UpdateRoomAsync(Guid hotelId, Guid roomId, UpdateRoomRequest req, CancellationToken ct = default)
    {
        var room = await _rooms.GetByIdForHotelAsync(roomId, hotelId, ct)
            ?? throw new NotFoundException("Room", roomId);

        if (req.RoomType is not null)    room.RoomType      = req.RoomType;
        if (req.PricePerNight.HasValue)  room.PricePerNight = req.PricePerNight.Value;
        if (req.MaxGuests.HasValue)      room.MaxGuests     = req.MaxGuests.Value;
        if (req.TotalRooms.HasValue)     room.TotalRooms    = req.TotalRooms.Value;
        if (req.Amenities is not null)   room.Amenities     = req.Amenities;
        if (req.Images is not null)      room.Images        = req.Images;
        if (req.IsActive.HasValue)       room.IsActive      = req.IsActive.Value;

        await _rooms.UpdateAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
        return ToRoomDto(room);
    }

    public async Task DeleteRoomAsync(Guid hotelId, Guid roomId, CancellationToken ct = default)
    {
        var room = await _rooms.GetByIdForHotelAsync(roomId, hotelId, ct)
            ?? throw new NotFoundException("Room", roomId);

        await _rooms.DeleteAsync(room, ct);
        await _uow.SaveChangesAsync(ct);
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    private static HotelProfileDto ToProfileDto(Hotel hotel) => new(
        hotel.Id,
        hotel.Name,
        hotel.City,
        hotel.Address,
        hotel.StarRating,
        hotel.ReviewScore,
        hotel.ReviewCount,
        hotel.Description,
        hotel.Amenities,
        hotel.ImageUrl,
        hotel.Images,
        hotel.IsActive,
        hotel.Rooms.Select(ToRoomDto).ToList()
    );

    private static HotelRoomManagerDto ToRoomDto(HotelRoom r) => new(
        r.Id,
        r.RoomType,
        r.PricePerNight,
        r.MaxGuests,
        r.TotalRooms,
        r.Amenities,
        r.Images,
        r.IsActive
    );
}
