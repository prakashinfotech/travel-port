using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Enums;

namespace TravelPort.Infrastructure.BackgroundServices;

public class BookingExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingExpiryWorker> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ExpiryThreshold = TimeSpan.FromMinutes(30);

    public BookingExpiryWorker(IServiceScopeFactory scopeFactory, ILogger<BookingExpiryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation("BookingExpiryWorker started. Checks every {Interval} min.", Interval.TotalMinutes);

        try
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await ExpireStaleBookingsAsync(ct);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error during booking expiry check.");
                }

                await Task.Delay(Interval, ct);
            }
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown — cancellation token was triggered, exit gracefully.
        }
    }

    private async Task ExpireStaleBookingsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var bookings = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var pending = await bookings.GetByStatusAsync(BookingStatus.Pending, ct);
        var cutoff = DateTime.UtcNow - ExpiryThreshold;
        var stale = pending.Where(b => b.CreatedAt < cutoff).ToList();

        if (stale.Count == 0) return;

        foreach (var booking in stale)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;
            await bookings.UpdateAsync(booking, ct);
        }

        await uow.SaveChangesAsync(ct);
        _logger.LogInformation("Expired {Count} stale pending bookings.", stale.Count);
    }
}
