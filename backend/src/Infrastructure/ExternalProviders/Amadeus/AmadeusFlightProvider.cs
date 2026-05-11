using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Infrastructure.ExternalProviders.Amadeus;

public class AmadeusFlightProvider : IExternalFlightProvider
{
    private readonly HttpClient _http;
    private readonly AmadeusTokenService _tokenService;
    private readonly AmadeusSettings _settings;
    private readonly ICacheService _cache;
    private readonly ILogger<AmadeusFlightProvider> _logger;

    public bool IsConfigured => _settings.Enabled
        && !string.IsNullOrWhiteSpace(_settings.ApiKey)
        && !string.IsNullOrWhiteSpace(_settings.ApiSecret);

    private static readonly Dictionary<string, string> AirlineNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["6E"] = "IndiGo",       ["AI"] = "Air India",     ["SG"] = "SpiceJet",
        ["UK"] = "Vistara",      ["QP"] = "Akasa Air",     ["IX"] = "Air India Express",
        ["I5"] = "Air Asia India",["G8"] = "Go First",      ["EK"] = "Emirates",
        ["QR"] = "Qatar Airways", ["EY"] = "Etihad Airways",["SQ"] = "Singapore Airlines",
        ["BA"] = "British Airways",["LH"] = "Lufthansa",   ["AF"] = "Air France",
        ["KL"] = "KLM",          ["TK"] = "Turkish Airlines",["ET"] = "Ethiopian Airlines",
    };

    private static readonly Dictionary<string, string> CityNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BOM"] = "Mumbai",    ["DEL"] = "Delhi",    ["BLR"] = "Bengaluru",
        ["MAA"] = "Chennai",   ["HYD"] = "Hyderabad",["AMD"] = "Ahmedabad",
        ["GOI"] = "Goa",       ["CCU"] = "Kolkata",  ["JAI"] = "Jaipur",
        ["PNQ"] = "Pune",      ["COK"] = "Kochi",    ["LKO"] = "Lucknow",
        ["IXC"] = "Chandigarh",["ATQ"] = "Amritsar", ["SXR"] = "Srinagar",
        ["DXB"] = "Dubai",     ["SIN"] = "Singapore",["LHR"] = "London",
        ["JFK"] = "New York",  ["CDG"] = "Paris",
    };

    public AmadeusFlightProvider(HttpClient http, AmadeusTokenService tokenService,
        IOptions<AmadeusSettings> settings, ICacheService cache,
        ILogger<AmadeusFlightProvider> logger)
    {
        _http = http;
        _tokenService = tokenService;
        _settings = settings.Value;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<FlightDto>> SearchAsync(FlightSearchRequest req, CancellationToken ct = default)
    {
        var token = await _tokenService.GetTokenAsync(ct);
        if (token is null)
        {
            _logger.LogWarning("Amadeus token unavailable — falling back to DB results");
            return [];
        }

        var date = req.DepartureDate.ToString("yyyy-MM-dd");
        var cabin = req.CabinClass.ToUpper() switch
        {
            "BUSINESS" => "BUSINESS",
            "FIRST"    => "FIRST",
            _          => "ECONOMY"
        };

        var url = $"{_settings.BaseUrl}/v2/shopping/flight-offers" +
                  $"?originLocationCode={req.Origin}" +
                  $"&destinationLocationCode={req.Destination}" +
                  $"&departureDate={date}" +
                  $"&adults={req.Passengers}" +
                  $"&travelClass={cabin}" +
                  $"&currencyCode=INR" +
                  $"&max=50" +
                  $"&nonStop=false";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Amadeus flight search HTTP error");
            return [];
        }

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Amadeus flight search returned {Status}: {Body}", response.StatusCode, err);
            return [];
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        var root = JsonSerializer.Deserialize<AmadeusFlightOffersResponse>(json);
        if (root?.Data is null) return [];

        var flights = new List<FlightDto>();
        foreach (var offer in root.Data)
        {
            try
            {
                var dto = MapOffer(offer, req.CabinClass);
                if (dto is null) continue;

                // Cache the offer so BookAsync can retrieve it by Guid
                await _cache.SetAsync($"amadeus_offer:{dto.Id}", offer, TimeSpan.FromMinutes(30), ct);
                flights.Add(dto);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to map Amadeus offer {OfferId}", offer.Id);
            }
        }

        return flights;
    }

    private FlightDto? MapOffer(AmadeusFlightOffer offer, string requestedCabin)
    {
        if (offer.Itineraries is null || offer.Itineraries.Count == 0) return null;

        var itin = offer.Itineraries[0];
        if (itin.Segments is null || itin.Segments.Count == 0) return null;

        var firstSeg = itin.Segments[0];
        var lastSeg  = itin.Segments[^1];

        var origin      = firstSeg.Departure?.IataCode ?? string.Empty;
        var destination = lastSeg.Arrival?.IataCode ?? string.Empty;
        var departure   = ParseDateTime(firstSeg.Departure?.At);
        var arrival     = ParseDateTime(lastSeg.Arrival?.At);
        var duration    = ParseDurationMinutes(itin.Duration);
        var stops       = itin.Segments.Count - 1;

        var carrierCode = firstSeg.CarrierCode ?? offer.ValidatingAirlineCodes?.FirstOrDefault() ?? "??";
        var airline     = AirlineNames.TryGetValue(carrierCode, out var name) ? name : carrierCode;
        var flightNo    = $"{firstSeg.CarrierCode}-{firstSeg.Number}";
        var aircraft    = firstSeg.Aircraft?.Code;

        var priceTotal = decimal.TryParse(offer.Price?.GrandTotal, out var p) ? p : 0m;

        // Baggage info from first traveler pricing
        var fareDetail = offer.TravelerPricings?.FirstOrDefault()
            ?.FareDetailsBySegment?.FirstOrDefault();
        var checkedBags    = fareDetail?.IncludedCheckedBags?.Quantity;
        var baggageIncluded = checkedBags is > 0;

        // Refundable — Amadeus doesn't expose this directly in sandbox; infer from fare basis
        var fareBasis    = fareDetail?.FareBasis ?? "";
        var isRefundable = fareBasis.Contains("REF", StringComparison.OrdinalIgnoreCase)
                        || fareBasis.StartsWith("Y", StringComparison.OrdinalIgnoreCase);

        var id = Guid.NewGuid();

        return new FlightDto(
            Id:             id,
            FlightNumber:   flightNo,
            Airline:        airline,
            AirlineCode:    carrierCode,
            Origin:         origin,
            OriginCity:     CityNames.TryGetValue(origin, out var oc) ? oc : origin,
            Destination:    destination,
            DestinationCity:CityNames.TryGetValue(destination, out var dc) ? dc : destination,
            DepartureTime:  departure,
            ArrivalTime:    arrival,
            DurationMinutes:duration,
            AvailableSeats: offer.NumberOfBookableSeats,
            Price:          priceTotal,
            BusinessPrice:  requestedCabin == "Business" ? priceTotal : null,
            CabinClass:     requestedCabin,
            Stops:          stops,
            IsRefundable:   isRefundable,
            BaggageIncluded:baggageIncluded,
            CheckedBags:    checkedBags,
            Aircraft:       aircraft,
            ExternalOfferId:offer.Id
        );
    }

    private static DateTime ParseDateTime(string? s)
        => DateTime.TryParse(s, out var dt) ? dt : DateTime.UtcNow;

    private static int ParseDurationMinutes(string? iso)
    {
        if (string.IsNullOrWhiteSpace(iso)) return 0;
        try { return (int)System.Xml.XmlConvert.ToTimeSpan(iso).TotalMinutes; }
        catch { return 0; }
    }

    // ── Amadeus JSON models ────────────────────────────────────────────────────

    private class AmadeusFlightOffersResponse
    {
        [JsonPropertyName("data")] public List<AmadeusFlightOffer>? Data { get; set; }
    }

    public class AmadeusFlightOffer
    {
        [JsonPropertyName("id")]                     public string? Id { get; set; }
        [JsonPropertyName("numberOfBookableSeats")]  public int NumberOfBookableSeats { get; set; }
        [JsonPropertyName("itineraries")]            public List<AmadeusItinerary>? Itineraries { get; set; }
        [JsonPropertyName("price")]                  public AmadeusPrice? Price { get; set; }
        [JsonPropertyName("validatingAirlineCodes")] public List<string>? ValidatingAirlineCodes { get; set; }
        [JsonPropertyName("travelerPricings")]       public List<AmadeusTravelerPricing>? TravelerPricings { get; set; }
        [JsonPropertyName("pricingOptions")]         public AmadeusPricingOptions? PricingOptions { get; set; }
    }

    public class AmadeusItinerary
    {
        [JsonPropertyName("duration")] public string? Duration { get; set; }
        [JsonPropertyName("segments")] public List<AmadeusSegment>? Segments { get; set; }
    }

    public class AmadeusSegment
    {
        [JsonPropertyName("departure")]    public AmadeusLocation? Departure { get; set; }
        [JsonPropertyName("arrival")]      public AmadeusLocation? Arrival { get; set; }
        [JsonPropertyName("carrierCode")]  public string? CarrierCode { get; set; }
        [JsonPropertyName("number")]       public string? Number { get; set; }
        [JsonPropertyName("aircraft")]     public AmadeusAircraft? Aircraft { get; set; }
        [JsonPropertyName("duration")]     public string? Duration { get; set; }
        [JsonPropertyName("numberOfStops")]public int NumberOfStops { get; set; }
    }

    public class AmadeusLocation
    {
        [JsonPropertyName("iataCode")] public string? IataCode { get; set; }
        [JsonPropertyName("at")]       public string? At { get; set; }
    }

    public class AmadeusAircraft
    {
        [JsonPropertyName("code")] public string? Code { get; set; }
    }

    public class AmadeusPrice
    {
        [JsonPropertyName("currency")]   public string? Currency { get; set; }
        [JsonPropertyName("total")]      public string? Total { get; set; }
        [JsonPropertyName("grandTotal")] public string? GrandTotal { get; set; }
    }

    public class AmadeusTravelerPricing
    {
        [JsonPropertyName("fareDetailsBySegment")] public List<AmadeusFareDetail>? FareDetailsBySegment { get; set; }
    }

    public class AmadeusFareDetail
    {
        [JsonPropertyName("cabin")]              public string? Cabin { get; set; }
        [JsonPropertyName("fareBasis")]          public string? FareBasis { get; set; }
        [JsonPropertyName("class")]              public string? Class { get; set; }
        [JsonPropertyName("includedCheckedBags")]public AmadeusBaggage? IncludedCheckedBags { get; set; }
    }

    public class AmadeusBaggage
    {
        [JsonPropertyName("quantity")] public int? Quantity { get; set; }
        [JsonPropertyName("weight")]   public int? Weight { get; set; }
    }

    public class AmadeusPricingOptions
    {
        [JsonPropertyName("fareType")]              public List<string>? FareType { get; set; }
        [JsonPropertyName("includedCheckedBagsOnly")]public bool IncludedCheckedBagsOnly { get; set; }
    }
}
