using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class BookingRepository : BaseRepository<Booking>, IBookingRepository
{
    public BookingRepository(TravelPortDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Booking>> GetUserBookingsAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _dbSet
            .Include(b => b.Payment)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Booking?> GetByRefAsync(string bookingRef, CancellationToken cancellationToken = default)
        => await _dbSet
            .Include(b => b.Payment)
            .FirstOrDefaultAsync(b => b.BookingRef == bookingRef, cancellationToken);

    public async Task<IReadOnlyList<Booking>> GetByStatusAsync(BookingStatus status, CancellationToken cancellationToken = default)
        => await _dbSet
            .Where(b => b.Status == status)
            .ToListAsync(cancellationToken);

    public async Task<string> GenerateBookingRefAsync(string prefix = "TP", CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _dbSet.CountAsync(cancellationToken);
        return $"{prefix}{year}{(count + 1):D6}";
    }

    public async Task<(IReadOnlyList<Booking> Items, int Total)> GetAllPagedAsync(
        int page, int pageSize, string? status = null, string? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(b => b.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, true, out var s))
            query = query.Where(b => b.Status == s);
        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<BookingType>(type, true, out var t))
            query = query.Where(b => b.BookingType == t);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<IReadOnlyList<Booking>> GetAllForAnalyticsAsync(
        DateTime from, DateTime to, CancellationToken cancellationToken = default)
        => await _dbSet
            .Where(b => b.CreatedAt >= from && b.CreatedAt <= to)
            .ToListAsync(cancellationToken);

    public async Task<(IReadOnlyList<Booking> Items, int Total)> GetHotelBookingsPagedAsync(
        Guid hotelId, int page, int pageSize, string? status, string? query,
        CancellationToken cancellationToken = default)
    {
        var q = _dbSet
            .Include(b => b.Payment)
            .Include(b => b.HotelCharges)
            .Where(b => b.BookingType == BookingType.Hotel && b.ReferenceId == hotelId);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, true, out var s))
            q = q.Where(b => b.Status == s);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q2 = query.ToLower();
            q = q.Where(b =>
                (b.GuestName != null && b.GuestName.ToLower().Contains(q2)) ||
                (b.GuestEmail != null && b.GuestEmail.ToLower().Contains(q2)) ||
                (b.GuestPhone != null && b.GuestPhone.Contains(q2)) ||
                b.BookingRef.ToLower().Contains(q2));
        }

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(b => b.CheckIn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<Booking?> GetHotelBookingWithChargesAsync(
        Guid bookingId, Guid hotelId, CancellationToken cancellationToken = default)
        => await _dbSet
            .Include(b => b.Payment)
            .Include(b => b.HotelCharges)
            .FirstOrDefaultAsync(b =>
                b.Id == bookingId &&
                b.BookingType == BookingType.Hotel &&
                b.ReferenceId == hotelId,
                cancellationToken);

    public async Task<IReadOnlyList<Booking>> GetTrainBookingsForDateAsync(
        DateTime travelDate, CancellationToken cancellationToken = default)
        => await _dbSet
            .Where(b => b.BookingType == BookingType.Train
                     && b.Status != BookingStatus.Cancelled
                     && b.CheckIn != null
                     && b.CheckIn.Value.Date == travelDate.Date)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Booking>> GetBookingsByFlightIdsAsync(
        IEnumerable<Guid> flightIds, CancellationToken ct = default)
        => await _dbSet
            .Include(b => b.User)
            .Where(b => b.BookingType == BookingType.Flight && flightIds.Contains(b.ReferenceId))
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Booking>> GetBookingsByOperatorNameAsync(
        string operatorName, BookingType type, CancellationToken ct = default)
        => await _dbSet
            .Include(b => b.User)
            .Where(b => b.BookingType == type
                     && b.TransportSnapshot != null
                     && b.TransportSnapshot.Contains(operatorName))
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);
}
