using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Services.Interfaces;

public interface ICabOperatorService
{
    Task<CabOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default);
    Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default);
}
