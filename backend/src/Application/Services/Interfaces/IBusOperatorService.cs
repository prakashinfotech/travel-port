using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Services.Interfaces;

public interface IBusOperatorService
{
    Task<BusOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default);

    // Bus CRUD
    Task<List<OperatorBusDto>> GetBusesAsync(Guid companyId, CancellationToken ct = default);
    Task<OperatorBusDto> AddBusAsync(Guid companyId, CreateBusRequest req, CancellationToken ct = default);
    Task<OperatorBusDto> UpdateBusAsync(Guid companyId, Guid busId, UpdateBusRequest req, CancellationToken ct = default);
    Task DeleteBusAsync(Guid companyId, Guid busId, CancellationToken ct = default);

    // Bookings
    Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default);

    // Seat layout
    Task<List<BusDateRouteDto>> GetBusesByDateAsync(Guid companyId, DateTime date, CancellationToken ct = default);
    Task<BusSeatLayoutDto> GetSeatLayoutAsync(Guid companyId, Guid busId, CancellationToken ct = default);
    Task<OperatorBusDto> UpdateSeatLayoutAsync(Guid companyId, Guid busId, BusSeatLayoutConfigRequest req, CancellationToken ct = default);
    Task<OperatorBookingDto> BulkBookSeatsAsync(Guid companyId, Guid busId, Guid managerId, BusBulkSeatBookingRequest req, CancellationToken ct = default);
    Task CancelSeatBookingAsync(Guid companyId, Guid bookingId, CancellationToken ct = default);
}
