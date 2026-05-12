using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TravelPort.Application.Services;
using TravelPort.Application.Services.Interfaces;

namespace TravelPort.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFlightService, FlightService>();
        services.AddScoped<IHotelService, HotelService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<IAdminService, AdminService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
