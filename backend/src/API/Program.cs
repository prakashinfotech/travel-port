using System.Text;
using System.Threading.RateLimiting;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using TravelPort.Application;
using TravelPort.Infrastructure;
using TravelPort.Persistence;
using TravelPort.API.Middleware;
using TravelPort.Infrastructure.Auth;
using TravelPort.Infrastructure.Services;
using TravelPort.Persistence.Context;
using TravelPort.Persistence.Seeds;
using TravelPort.Application.Common.Models;

// PdfSharpCore has no GDI font discovery on Linux — register Liberation Sans as Arial substitute
PdfSharp.Fonts.GlobalFontSettings.FontResolver = new LinuxFontResolver();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/travelport-.log", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting TravelPort API");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, config) =>
        config.ReadFrom.Configuration(ctx.Configuration)
              .ReadFrom.Services(services)
              .WriteTo.Console()
              .WriteTo.File("logs/travelport-.log", rollingInterval: RollingInterval.Day));

    // ── Services ─────────────────────────────────────────────────────────────
    builder.Services.AddPersistence(builder.Configuration);
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();

    // Distributed cache (in-memory; swap to Redis: AddStackExchangeRedisCache)
    builder.Services.AddDistributedMemoryCache();

    // JWT Authentication
    var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
        ?? throw new InvalidOperationException("JwtSettings configuration is missing.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization();

    // App Settings
    builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));

    // CORS
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:5173"];

    builder.Services.AddCors(options =>
        options.AddPolicy("TravelPortCors", policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()));

    // Rate Limiting
    builder.Services.AddRateLimiter(options =>
    {
        options.AddFixedWindowLimiter("AuthPolicy", cfg =>
        {
            cfg.PermitLimit = 5;
            cfg.Window = TimeSpan.FromMinutes(15);
            cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            cfg.QueueLimit = 0;
        });

        options.AddFixedWindowLimiter("GlobalPolicy", cfg =>
        {
            cfg.PermitLimit = 100;
            cfg.Window = TimeSpan.FromMinutes(1);
            cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            cfg.QueueLimit = 2;
        });

        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    // HTTP client (used by AiController to proxy Claude API calls)
    builder.Services.AddHttpClient();
    builder.Services.AddResponseCaching();

    // FluentValidation — validators registered via AddApplication(); auto-validation wires them into MVC pipeline
    builder.Services.AddFluentValidationAutoValidation();

    // Controllers & Swagger
    builder.Services.AddControllers()
        .AddJsonOptions(o =>
            o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "TravelPort API",
            Version = "v1",
            Description = "Goibibo-inspired travel booking platform API"
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token (without 'Bearer ' prefix)"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    // ── Pipeline ─────────────────────────────────────────────────────────────
    var app = builder.Build();

    // SSDT/DACPAC is the deployment authority. EF migrations are available only
    // as an explicit local-development fallback and are disabled by default.
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<TravelPortDbContext>();
        if (builder.Configuration.GetValue<bool>("Database:ApplyEfMigrations"))
            db.Database.Migrate();

        if (builder.Configuration.GetValue("Database:RunSeedData", true))
            await DataSeeder.SeedAsync(db);
    }

    app.UseMiddleware<ExceptionMiddleware>();

    // Swagger available in all environments — restrict via network/auth in production as needed
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TravelPort API v1"));

    if (!app.Environment.IsDevelopment())
        app.UseHttpsRedirection();
    app.UseSerilogRequestLogging();
    app.UseResponseCaching();
    app.UseCors("TravelPortCors");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "TravelPort API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
