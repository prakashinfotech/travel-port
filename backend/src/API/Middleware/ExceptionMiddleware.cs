using System.Net;
using System.Text.Json;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Models;

namespace TravelPort.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            NotFoundException ex    => (HttpStatusCode.NotFound, ex.Message),
            BusinessException ex    => (HttpStatusCode.UnprocessableEntity, ex.Message),
            UnauthorizedException ex => (HttpStatusCode.Unauthorized, ex.Message),
            _                       => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        var response = ApiResponse<object>.Fail(message);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        return context.Response.WriteAsync(json);
    }
}
