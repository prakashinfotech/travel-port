using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Services.Interfaces;

public interface IBusOperatorService
{
    Task<BusOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default);
    Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default);
}
