using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Services.Interfaces;

public interface IHotelManagerService
{
    Task<HotelManagerDashboardDto> GetDashboardAsync(Guid hotelId, CancellationToken ct = default);
    Task<(List<HotelManagerBookingDto> Items, int Total)> GetBookingsAsync(Guid hotelId, int page, int pageSize, string? status, CancellationToken ct = default);
    Task<HotelProfileDto> GetHotelProfileAsync(Guid hotelId, CancellationToken ct = default);
    Task<HotelProfileDto> UpdateHotelDetailsAsync(Guid hotelId, UpdateHotelDetailsRequest req, CancellationToken ct = default);
    Task<HotelRoomManagerDto> AddRoomAsync(Guid hotelId, CreateRoomRequest req, CancellationToken ct = default);
    Task<HotelRoomManagerDto> UpdateRoomAsync(Guid hotelId, Guid roomId, UpdateRoomRequest req, CancellationToken ct = default);
    Task DeleteRoomAsync(Guid hotelId, Guid roomId, CancellationToken ct = default);
}
