using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Infrastructure.ExternalProviders.Duffel;

public class DuffelFlightProvider : IExternalFlightProvider
{
    private readonly HttpClient  _http;
    private readonly DuffelSettings _settings;
    private readonly ICacheService  _cache;
    private readonly ILogger<DuffelFlightProvider> _logger;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public bool IsConfigured =>
        _settings.Enabled && !string.IsNullOrWhiteSpace(_settings.ApiToken);

    private static readonly Dictionary<string, string> CityNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BOM"] = "Mumbai",    ["DEL"] = "Delhi",    ["BLR"] = "Bengaluru",
        ["MAA"] = "Chennai",   ["HYD"] = "Hyderabad",["AMD"] = "Ahmedabad",
        ["GOI"] = "Goa",       ["CCU"] = "Kolkata",  ["JAI"] = "Jaipur",
        ["PNQ"] = "Pune",      ["COK"] = "Kochi",    ["LKO"] = "Lucknow",
        ["IXC"] = "Chandigarh",["ATQ"] = "Amritsar", ["SXR"] = "Srinagar",
        ["DXB"] = "Dubai",     ["SIN"] = "Singapore",["LHR"] = "London",
        ["JFK"] = "New York",  ["CDG"] = "Paris",    ["SYD"] = "Sydney",
    };

    public DuffelFlightProvider(HttpClient http, IOptions<DuffelSettings> settings,
        ICacheService cache, ILogger<DuffelFlightProvider> logger)
    {
        _http     = http;
        _settings = settings.Value;
        _cache    = cache;
        _logger   = logger;
    }

    public async Task<List<FlightDto>> SearchAsync(FlightSearchRequest req, CancellationToken ct = default)
    {
        var cabin = req.CabinClass?.ToLower() switch
        {
            "business"         => "business",
            "first"            => "first",
            "premium_economy"  => "premium_economy",
            "premium economy"  => "premium_economy",
            _                  => "economy",
        };

        // Build request body — Duffel wraps everything in "data"
        var body = new
        {
            data = new
            {
                slices = new[]
                {
                    new
                    {
                        origin         = req.Origin.ToUpper(),
                        destination    = req.Destination.ToUpper(),
                        departure_date = req.DepartureDate.ToString("yyyy-MM-dd"),
                    }
                },
                passengers      = Enumerable.Repeat(new { type = "adult" }, Math.Max(1, req.Passengers)),
                cabin_class     = cabin,
                max_connections = 1,
            }
        };

        var bodyJson = JsonSerializer.Serialize(body, _json);
        var content  = new StringContent(bodyJson, Encoding.UTF8, "application/json");

        // return_offers=true tells Duffel to embed offers directly in the response
        var url = $"{_settings.BaseUrl}/air/offer_requests?return_offers=true";

        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiToken);
        request.Headers.Add("Duffel-Version", "v2");

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Duffel flight search HTTP error");
            return [];
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Duffel returned {Status}: {Body}", response.StatusCode, err[..Math.Min(500, err.Length)]);
            return [];
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        DuffelOfferRequestResponse? root;
        try
        {
            root = JsonSerializer.Deserialize<DuffelOfferRequestResponse>(json, _json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deserialize Duffel response");
            return [];
        }

        if (root?.Data?.Offers is null || root.Data.Offers.Count == 0)
        {
            _logger.LogInformation("Duffel returned 0 offers for {O}→{D}", req.Origin, req.Destination);
            return [];
        }

        var flights = new List<FlightDto>();
        foreach (var offer in root.Data.Offers)
        {
            try
            {
                var dto = MapOffer(offer, req.CabinClass ?? "Economy");
                if (dto is null) continue;

                // Cache full offer JSON so BookAsync can retrieve price by Guid
                var rawElement = JsonSerializer.Deserialize<JsonElement>(
                    JsonSerializer.Serialize(offer, _json), _json);
                await _cache.SetAsync($"duffel_offer:{dto.Id}", rawElement, TimeSpan.FromMinutes(30), ct);

                flights.Add(dto);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to map Duffel offer {Id}", offer.Id);
            }
        }

        _logger.LogInformation("Duffel returned {Count} offers for {O}→{D}", flights.Count, req.Origin, req.Destination);
        return flights;
    }

    private FlightDto? MapOffer(DuffelOffer offer, string requestedCabin)
    {
        var slice = offer.Slices?.FirstOrDefault();
        if (slice?.Segments is null || slice.Segments.Count == 0) return null;

        var firstSeg = slice.Segments[0];
        var lastSeg  = slice.Segments[^1];

        var origin       = firstSeg.Origin?.IataCode ?? slice.Origin?.IataCode ?? string.Empty;
        var destination  = lastSeg.Destination?.IataCode ?? slice.Destination?.IataCode ?? string.Empty;
        var depTime      = ParseDateTime(firstSeg.DepartingAt);
        var arrTime      = ParseDateTime(lastSeg.ArrivingAt);
        var durationMins = ParseIso8601Duration(slice.Duration ?? firstSeg.Duration);
        var stops        = slice.Segments.Count - 1;

        // Use operating_carrier of first segment; fall back to offer owner
        var carrier     = firstSeg.OperatingCarrier ?? firstSeg.MarketingCarrier ?? offer.Owner;
        var airlineCode = carrier?.IataCode ?? "??";
        var airline     = carrier?.Name ?? airlineCode;

        var flightNum   = string.IsNullOrWhiteSpace(firstSeg.MarketingCarrierFlightNumber)
            ? $"{airlineCode}-{firstSeg.OperatingCarrierFlightNumber}"
            : $"{airlineCode}-{firstSeg.MarketingCarrierFlightNumber}";

        var aircraft = firstSeg.Aircraft?.Name;

        var price = decimal.TryParse(offer.TotalAmount, out var p) ? p : 0m;

        // Baggage — look at first passenger's baggages
        var bags = offer.Passengers?.FirstOrDefault()?.Baggages
            ?.Where(b => string.Equals(b.Type, "checked", StringComparison.OrdinalIgnoreCase))
            .ToList();
        var checkedBags     = bags?.Sum(b => b.Quantity);
        var baggageIncluded = checkedBags is > 0;

        // Refundable — check conditions
        var refundInfo  = offer.Conditions?.RefundBeforeDeparture;
        var isRefundable = refundInfo?.Allowed == true;

        var id = Guid.NewGuid();

        return new FlightDto(
            Id:              id,
            FlightNumber:    flightNum,
            Airline:         airline,
            AirlineCode:     airlineCode,
            Origin:          origin,
            OriginCity:      CityNames.TryGetValue(origin, out var oc)
                                ? oc : (firstSeg.Origin?.CityName ?? origin),
            Destination:     destination,
            DestinationCity: CityNames.TryGetValue(destination, out var dc)
                                ? dc : (lastSeg.Destination?.CityName ?? destination),
            DepartureTime:   depTime,
            ArrivalTime:     arrTime,
            DurationMinutes: durationMins,
            AvailableSeats:  9,   // Duffel sandbox doesn't expose seat count; show 9
            Price:           price,
            BusinessPrice:   requestedCabin == "Business" ? price : null,
            CabinClass:      requestedCabin,
            Stops:           stops,
            IsRefundable:    isRefundable,
            BaggageIncluded: baggageIncluded,
            CheckedBags:     checkedBags,
            Aircraft:        aircraft,
            ExternalOfferId: offer.Id
        );
    }

    private static DateTime ParseDateTime(string? s)
        => DateTime.TryParse(s, null, System.Globalization.DateTimeStyles.RoundtripKind, out var dt)
            ? dt : DateTime.UtcNow;

    private static int ParseIso8601Duration(string? iso)
    {
        if (string.IsNullOrWhiteSpace(iso)) return 0;
        try { return (int)System.Xml.XmlConvert.ToTimeSpan(iso).TotalMinutes; }
        catch { return 0; }
    }

    // ── Duffel JSON response models ────────────────────────────────────────────

    private class DuffelOfferRequestResponse
    {
        [JsonPropertyName("data")] public DuffelOfferRequestData? Data { get; set; }
    }

    private class DuffelOfferRequestData
    {
        [JsonPropertyName("id")]     public string? Id { get; set; }
        [JsonPropertyName("offers")] public List<DuffelOffer>? Offers { get; set; }
    }

    private class DuffelOffer
    {
        [JsonPropertyName("id")]             public string? Id { get; set; }
        [JsonPropertyName("total_amount")]   public string? TotalAmount { get; set; }
        [JsonPropertyName("total_currency")] public string? TotalCurrency { get; set; }
        [JsonPropertyName("expires_at")]     public string? ExpiresAt { get; set; }
        [JsonPropertyName("owner")]          public DuffelAirline? Owner { get; set; }
        [JsonPropertyName("slices")]         public List<DuffelSlice>? Slices { get; set; }
        [JsonPropertyName("passengers")]     public List<DuffelPassenger>? Passengers { get; set; }
        [JsonPropertyName("conditions")]     public DuffelConditions? Conditions { get; set; }
    }

    private class DuffelAirline
    {
        [JsonPropertyName("iata_code")] public string? IataCode { get; set; }
        [JsonPropertyName("name")]      public string? Name { get; set; }
    }

    private class DuffelSlice
    {
        [JsonPropertyName("duration")]    public string? Duration { get; set; }
        [JsonPropertyName("origin")]      public DuffelLocation? Origin { get; set; }
        [JsonPropertyName("destination")] public DuffelLocation? Destination { get; set; }
        [JsonPropertyName("segments")]    public List<DuffelSegment>? Segments { get; set; }
    }

    private class DuffelLocation
    {
        [JsonPropertyName("iata_code")]  public string? IataCode { get; set; }
        [JsonPropertyName("city_name")]  public string? CityName { get; set; }
        [JsonPropertyName("name")]       public string? Name { get; set; }
    }

    private class DuffelSegment
    {
        [JsonPropertyName("operating_carrier")]               public DuffelAirline? OperatingCarrier { get; set; }
        [JsonPropertyName("marketing_carrier")]               public DuffelAirline? MarketingCarrier { get; set; }
        [JsonPropertyName("operating_carrier_flight_number")] public string? OperatingCarrierFlightNumber { get; set; }
        [JsonPropertyName("marketing_carrier_flight_number")] public string? MarketingCarrierFlightNumber { get; set; }
        [JsonPropertyName("origin")]      public DuffelLocation? Origin { get; set; }
        [JsonPropertyName("destination")] public DuffelLocation? Destination { get; set; }
        [JsonPropertyName("departing_at")]public string? DepartingAt { get; set; }
        [JsonPropertyName("arriving_at")] public string? ArrivingAt { get; set; }
        [JsonPropertyName("duration")]    public string? Duration { get; set; }
        [JsonPropertyName("aircraft")]    public DuffelAircraft? Aircraft { get; set; }
    }

    private class DuffelAircraft
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
    }

    private class DuffelPassenger
    {
        [JsonPropertyName("id")]       public string? Id { get; set; }
        [JsonPropertyName("type")]     public string? Type { get; set; }
        [JsonPropertyName("baggages")] public List<DuffelBaggage>? Baggages { get; set; }
    }

    private class DuffelBaggage
    {
        [JsonPropertyName("type")]     public string? Type { get; set; }
        [JsonPropertyName("quantity")] public int Quantity { get; set; }
    }

    private class DuffelConditions
    {
        [JsonPropertyName("refund_before_departure")] public DuffelRefundInfo? RefundBeforeDeparture { get; set; }
    }

    private class DuffelRefundInfo
    {
        [JsonPropertyName("allowed")]        public bool    Allowed { get; set; }
        [JsonPropertyName("penalty_amount")] public string? PenaltyAmount { get; set; }
    }
}
