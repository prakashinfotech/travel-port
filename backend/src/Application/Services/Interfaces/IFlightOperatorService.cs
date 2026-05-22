using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Services.Interfaces;

public interface IFlightOperatorService
{
    Task<FlightOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default);
    Task<List<OperatorFlightDto>> GetFlightsAsync(Guid companyId, CancellationToken ct = default);
    Task<OperatorFlightDto> AddFlightAsync(Guid companyId, CreateFlightRequest req, CancellationToken ct = default);
    Task<OperatorFlightDto> UpdateFlightAsync(Guid companyId, Guid flightId, UpdateFlightRequest req, CancellationToken ct = default);
    Task DeleteFlightAsync(Guid companyId, Guid flightId, CancellationToken ct = default);
    Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default);

    // Seat layout
    Task<List<FlightDateRouteDto>> GetFlightsByDateAsync(Guid companyId, DateTime date, CancellationToken ct = default);
    Task<SeatLayoutDto> GetSeatLayoutAsync(Guid companyId, Guid flightId, CancellationToken ct = default);
    Task<OperatorFlightDto> UpdateSeatLayoutAsync(Guid companyId, Guid flightId, SeatLayoutConfigRequest req, CancellationToken ct = default);
    Task<OperatorBookingDto> BulkBookSeatsAsync(Guid companyId, Guid flightId, Guid managerId, BulkSeatBookingRequest req, CancellationToken ct = default);
    Task CancelSeatBookingAsync(Guid companyId, Guid bookingId, CancellationToken ct = default);
}
