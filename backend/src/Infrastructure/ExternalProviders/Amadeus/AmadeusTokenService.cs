using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TravelPort.Infrastructure.ExternalProviders.Amadeus;

public class AmadeusTokenService
{
    private readonly HttpClient _http;
    private readonly AmadeusSettings _settings;
    private readonly ILogger<AmadeusTokenService> _logger;

    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public AmadeusTokenService(HttpClient http, IOptions<AmadeusSettings> settings,
        ILogger<AmadeusTokenService> logger)
    {
        _http = http;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string?> GetTokenAsync(CancellationToken ct = default)
    {
        if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry)
            return _cachedToken;

        await _lock.WaitAsync(ct);
        try
        {
            // Double-check after acquiring lock
            if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry)
                return _cachedToken;

            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"]    = "client_credentials",
                ["client_id"]     = _settings.ApiKey,
                ["client_secret"] = _settings.ApiSecret,
            });

            var response = await _http.PostAsync($"{_settings.BaseUrl}/v1/security/oauth2/token", content, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Amadeus token request failed: {Status}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var result = JsonSerializer.Deserialize<AmadeusTokenResponse>(json);
            if (result?.AccessToken is null) return null;

            _cachedToken = result.AccessToken;
            _tokenExpiry = DateTime.UtcNow.AddSeconds(result.ExpiresIn - 60); // 60s safety margin
            return _cachedToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to obtain Amadeus access token");
            return null;
        }
        finally
        {
            _lock.Release();
        }
    }

    private class AmadeusTokenResponse
    {
        [JsonPropertyName("access_token")] public string? AccessToken { get; set; }
        [JsonPropertyName("expires_in")]   public int ExpiresIn { get; set; }
    }
}
