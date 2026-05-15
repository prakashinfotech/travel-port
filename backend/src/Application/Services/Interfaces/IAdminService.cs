using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Services.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default);
    Task<(List<AdminUserDto> Items, int Total)> GetUsersAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<AdminUserDto> ToggleUserBlockAsync(Guid userId, CancellationToken ct = default);
    Task<(List<BookingDto> Items, int Total)> GetBookingsAsync(int page, int pageSize, string? status, string? type, CancellationToken ct = default);
    Task<List<CouponDto>> GetCouponsAsync(CancellationToken ct = default);
    Task<CouponDto> CreateCouponAsync(CreateCouponRequest req, CancellationToken ct = default);
    Task<CouponDto> UpdateCouponAsync(Guid id, UpdateCouponRequest req, CancellationToken ct = default);
    Task DeleteCouponAsync(Guid id, CancellationToken ct = default);
    Task<AdminAnalyticsDto> GetAnalyticsAsync(CancellationToken ct = default);

    // Hotel management
    Task<List<AdminHotelListDto>> GetHotelsAsync(CancellationToken ct = default);
    Task<AdminHotelListDto> RegisterHotelAsync(RegisterHotelRequest req, CancellationToken ct = default);
    Task<AdminHotelListDto> ToggleHotelActiveAsync(Guid hotelId, CancellationToken ct = default);
}
