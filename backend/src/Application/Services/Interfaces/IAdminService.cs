using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.DTOs.Operator;

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
    Task DeleteHotelReviewAsync(Guid reviewId, CancellationToken ct = default);

    // Operator management
    Task<List<FlightOperatorListDto>> GetFlightOperatorsAsync(CancellationToken ct = default);
    Task<FlightOperatorListDto> RegisterFlightOperatorAsync(RegisterFlightOperatorRequest req, CancellationToken ct = default);
    Task<FlightOperatorListDto> ToggleFlightOperatorActiveAsync(Guid companyId, CancellationToken ct = default);

    Task<List<BusOperatorListDto>> GetBusOperatorsAsync(CancellationToken ct = default);
    Task<BusOperatorListDto> RegisterBusOperatorAsync(RegisterBusOperatorRequest req, CancellationToken ct = default);
    Task<BusOperatorListDto> ToggleBusOperatorActiveAsync(Guid companyId, CancellationToken ct = default);

    Task<List<CabOperatorListDto>> GetCabOperatorsAsync(CancellationToken ct = default);
    Task<CabOperatorListDto> RegisterCabOperatorAsync(RegisterCabOperatorRequest req, CancellationToken ct = default);
    Task<CabOperatorListDto> ToggleCabOperatorActiveAsync(Guid companyId, CancellationToken ct = default);
}
