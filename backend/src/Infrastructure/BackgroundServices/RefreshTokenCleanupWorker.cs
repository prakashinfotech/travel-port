using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TravelPort.Application.Common.Interfaces;

namespace TravelPort.Infrastructure.BackgroundServices;

public class RefreshTokenCleanupWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupWorker> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    public RefreshTokenCleanupWorker(IServiceScopeFactory scopeFactory, ILogger<RefreshTokenCleanupWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation("RefreshTokenCleanupWorker started. Runs every {Hours}h.", Interval.TotalHours);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                await CleanupAsync(ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error during refresh token cleanup.");
            }

            await Task.Delay(Interval, ct);
        }
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var tokens = scope.ServiceProvider.GetRequiredService<IRefreshTokenRepository>();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var count = await tokens.DeleteExpiredAsync(ct);
        await uow.SaveChangesAsync(ct);

        _logger.LogInformation("Cleaned up {Count} expired/revoked refresh tokens.", count);
    }
}
