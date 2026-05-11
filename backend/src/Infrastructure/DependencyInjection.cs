using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Infrastructure.Auth;
using TravelPort.Infrastructure.BackgroundServices;
using TravelPort.Infrastructure.ExternalProviders.Amadeus;
using TravelPort.Infrastructure.ExternalProviders.Duffel;
using TravelPort.Infrastructure.ExternalProviders.Email;
using TravelPort.Infrastructure.ExternalProviders.Payment;
using TravelPort.Infrastructure.ExternalProviders.Transport;
using TravelPort.Infrastructure.Services;

namespace TravelPort.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // ── Core ──────────────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICacheService, CacheService>();

        // ── Duffel (primary external flight provider) ─────────────────────────
        services.Configure<DuffelSettings>(configuration.GetSection("Duffel"));
        services.AddHttpClient<DuffelFlightProvider>();
        services.AddScoped<IExternalFlightProvider, DuffelFlightProvider>();

        // ── Amadeus Hotel provider (kept for hotel search) ────────────────────
        services.Configure<AmadeusSettings>(configuration.GetSection("Amadeus"));
        services.AddHttpClient<AmadeusTokenService>();
        services.AddSingleton<AmadeusTokenService>();
        services.AddHttpClient<AmadeusHotelProvider>();
        services.AddScoped<IExternalHotelProvider, AmadeusHotelProvider>();

        // ── Razorpay ──────────────────────────────────────────────────────────
        services.Configure<RazorpaySettings>(configuration.GetSection("Razorpay"));
        services.AddHttpClient<RazorpayService>();
        services.AddScoped<IPaymentService, RazorpayService>();

        // ── Email (SMTP) ──────────────────────────────────────────────────────
        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IInvoiceDocumentService, InvoiceDocumentService>();

        // ── Transport mock providers ──────────────────────────────────────────
        services.AddSingleton<BusSearchProvider>();
        services.AddSingleton<TrainSearchProvider>();
        services.AddSingleton<CabSearchProvider>();

        // ── Background workers ────────────────────────────────────────────────
        services.AddHostedService<BookingExpiryWorker>();
        services.AddHostedService<RefreshTokenCleanupWorker>();

        return services;
    }
}
