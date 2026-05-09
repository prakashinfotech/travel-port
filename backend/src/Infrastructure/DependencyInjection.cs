using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Infrastructure.Auth;
using TravelPort.Infrastructure.BackgroundServices;
using TravelPort.Infrastructure.Services;

namespace TravelPort.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtService, JwtService>();

        services.AddScoped<ICacheService, CacheService>();

        // Background workers
        services.AddHostedService<BookingExpiryWorker>();
        services.AddHostedService<RefreshTokenCleanupWorker>();

        return services;
    }
}
