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

    public async Task<string> GenerateBookingRefAsync(CancellationToken cancellationToken = default)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _dbSet.CountAsync(cancellationToken);
        return $"TP{year}{(count + 1):D6}";
    }
}
