using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class CabOperatorService : ICabOperatorService
{
    private readonly ICabCompanyRepository _companies;
    private readonly IBookingRepository _bookings;

    public CabOperatorService(ICabCompanyRepository companies, IBookingRepository bookings)
    {
        _companies = companies;
        _bookings  = bookings;
    }

    public async Task<CabOperatorDashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct = default)
    {
        var company   = await _companies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("CabCompany", companyId);

        var bookings   = await _bookings.GetBookingsByOperatorNameAsync(company.Name, BookingType.Cab, ct);
        var confirmed  = bookings.Count(b => b.Status == BookingStatus.Confirmed);
        var cancelled  = bookings.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue    = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var passengers = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.Passengers ?? 0);

        return new CabOperatorDashboardDto(
            company.Name,
            company.IsIndividualDriver,
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
            ?? throw new NotFoundException("CabCompany", companyId);

        var bookings = await _bookings.GetBookingsByOperatorNameAsync(company.Name, BookingType.Cab, ct);
        return bookings.Select(b => new OperatorBookingDto(
            b.Id, b.BookingRef,
            b.GuestName ?? b.User?.Name ?? "Guest",
            b.GuestEmail ?? b.User?.Email ?? "",
            b.GuestPhone ?? b.User?.Phone,
            b.Passengers ?? 1,
            "Cab",
            b.FinalAmount,
            b.Status.ToString(),
            b.CreatedAt,
            null,
            b.PaymentMethod
        )).ToList();
    }
}
