using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class BusOperatorService : IBusOperatorService
{
    private readonly IBusCompanyRepository _companies;
    private readonly IBookingRepository _bookings;

    public BusOperatorService(IBusCompanyRepository companies, IBookingRepository bookings)
    {
        _companies = companies;
        _bookings  = bookings;
    }

    public async Task<BusOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default)
    {
        var company  = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("BusCompany", companyId);

        var bookings  = await _bookings.GetBookingsByOperatorNameAsync(company.Name, BookingType.Bus, ct);
        var confirmed = bookings.Count(b => b.Status == BookingStatus.Confirmed);
        var cancelled = bookings.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue   = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var passengers = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.Passengers ?? 0);

        return new BusOperatorDashboardDto(
            company.Name,
            bookings.Count,
            confirmed,
            cancelled,
            revenue,
            passengers
        );
    }

    public async Task<List<OperatorBookingDto>> GetBookingsAsync(Guid companyId, CancellationToken ct = default)
    {
        var company  = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("BusCompany", companyId);

        var bookings = await _bookings.GetBookingsByOperatorNameAsync(company.Name, BookingType.Bus, ct);
        return bookings.Select(b => new OperatorBookingDto(
            b.Id, b.BookingRef,
            b.GuestName ?? b.User?.Name ?? "Guest",
            b.GuestEmail ?? b.User?.Email ?? "",
            b.GuestPhone ?? b.User?.Phone,
            b.Passengers ?? 1,
            "Bus",
            b.FinalAmount,
            b.Status.ToString(),
            b.CreatedAt
        )).ToList();
    }
}
