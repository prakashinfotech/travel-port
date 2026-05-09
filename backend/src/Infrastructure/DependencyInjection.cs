using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Infrastructure.Auth;

namespace TravelPort.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtService, JwtService>();
        return services;
    }
}
