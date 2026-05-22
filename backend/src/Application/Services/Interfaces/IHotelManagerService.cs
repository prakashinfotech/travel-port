using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Services.Interfaces;

public interface IHotelManagerService
{
    Task<HotelManagerDashboardDto> GetDashboardAsync(Guid hotelId, CancellationToken ct = default);
    Task<(List<HotelManagerBookingDto> Items, int Total)> GetBookingsAsync(Guid hotelId, int page, int pageSize, string? status, string? query, CancellationToken ct = default);
    Task<HotelBookingDetailDto> GetBookingDetailAsync(Guid hotelId, Guid bookingId, CancellationToken ct = default);
    Task<HotelBookingDetailDto> CheckInGuestAsync(Guid hotelId, Guid bookingId, CheckInRequest req, CancellationToken ct = default);
    Task<HotelBookingDetailDto> AddChargeAsync(Guid hotelId, Guid bookingId, AddHotelChargeRequest req, CancellationToken ct = default);
    Task DeleteChargeAsync(Guid hotelId, Guid bookingId, Guid chargeId, CancellationToken ct = default);
    Task<HotelInvoiceDto> GetInvoiceAsync(Guid hotelId, Guid bookingId, CancellationToken ct = default);
    Task<HotelInvoiceDto> CheckOutGuestAsync(Guid hotelId, Guid bookingId, CheckOutRequest req, CancellationToken ct = default);
    Task<List<RoomAvailabilityDto>> GetAvailabilityAsync(Guid hotelId, DateTime checkIn, DateTime checkOut, CancellationToken ct = default);
    Task<HotelProfileDto> GetHotelProfileAsync(Guid hotelId, CancellationToken ct = default);
    Task<HotelProfileDto> UpdateHotelDetailsAsync(Guid hotelId, UpdateHotelDetailsRequest req, CancellationToken ct = default);
    Task<HotelRoomManagerDto> AddRoomAsync(Guid hotelId, CreateRoomRequest req, CancellationToken ct = default);
    Task<HotelRoomManagerDto> UpdateRoomAsync(Guid hotelId, Guid roomId, UpdateRoomRequest req, CancellationToken ct = default);
    Task DeleteRoomAsync(Guid hotelId, Guid roomId, CancellationToken ct = default);
}
