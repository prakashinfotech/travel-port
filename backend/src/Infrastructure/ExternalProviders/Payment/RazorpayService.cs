using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Payments;

namespace TravelPort.Infrastructure.ExternalProviders.Payment;

public class RazorpayService : IPaymentService
{
    private readonly HttpClient _http;
    private readonly RazorpaySettings _settings;
    private const string BaseUrl = "https://api.razorpay.com/v1";

    public bool IsConfigured => _settings.Enabled
        && !string.IsNullOrWhiteSpace(_settings.KeyId)
        && !string.IsNullOrWhiteSpace(_settings.KeySecret);

    public RazorpayService(HttpClient http, IOptions<RazorpaySettings> settings)
    {
        _http = http;
        _settings = settings.Value;
        SetBasicAuth();
    }

    private void SetBasicAuth()
    {
        var credentials = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{_settings.KeyId}:{_settings.KeySecret}"));
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);
    }

    public async Task<CreateOrderResponse> CreateOrderAsync(CreateOrderRequest req, CancellationToken ct = default)
    {
        // Razorpay amounts are in paise (1 INR = 100 paise)
        var amountPaise = (long)(req.Amount * 100);
        var body = JsonSerializer.Serialize(new
        {
            amount   = amountPaise,
            currency = req.Currency,
            receipt  = $"TP_{req.BookingId:N}",
            notes    = new { bookingId = req.BookingId }
        });

        using var httpReq = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/orders")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        var response = await _http.SendAsync(httpReq, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var order = JsonSerializer.Deserialize<RazorpayOrder>(json)
            ?? throw new InvalidOperationException("Invalid Razorpay order response");

        return new CreateOrderResponse(order.Id!, req.Amount, req.Currency, _settings.KeyId);
    }

    public bool VerifySignature(string orderId, string paymentId, string signature)
    {
        var payload = $"{orderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_settings.KeySecret));
        var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var expected = BitConverter.ToString(computed).Replace("-", "").ToLower();
        return string.Equals(expected, signature, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<PaymentStatusResponse> GetPaymentStatusAsync(string paymentId, CancellationToken ct = default)
    {
        var response = await _http.GetAsync($"{BaseUrl}/payments/{paymentId}", ct);
        response.EnsureSuccessStatusCode();

        var json    = await response.Content.ReadAsStringAsync(ct);
        var payment = JsonSerializer.Deserialize<RazorpayPayment>(json)
            ?? throw new InvalidOperationException("Invalid Razorpay payment response");

        return new PaymentStatusResponse(
            payment.Id!,
            payment.Status ?? "unknown",
            (payment.Amount / 100m),
            payment.Method ?? "card"
        );
    }

    private class RazorpayOrder
    {
        [JsonPropertyName("id")]       public string? Id { get; set; }
        [JsonPropertyName("status")]   public string? Status { get; set; }
        [JsonPropertyName("amount")]   public long Amount { get; set; }
        [JsonPropertyName("currency")] public string? Currency { get; set; }
    }

    private class RazorpayPayment
    {
        [JsonPropertyName("id")]       public string? Id { get; set; }
        [JsonPropertyName("status")]   public string? Status { get; set; }
        [JsonPropertyName("amount")]   public long Amount { get; set; }
        [JsonPropertyName("method")]   public string? Method { get; set; }
        [JsonPropertyName("currency")] public string? Currency { get; set; }
    }
}
