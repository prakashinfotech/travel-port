using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Infrastructure.ExternalProviders.Amadeus;

public class AmadeusHotelProvider : IExternalHotelProvider
{
    private readonly HttpClient _http;
    private readonly AmadeusTokenService _tokenService;
    private readonly AmadeusSettings _settings;
    private readonly ICacheService _cache;
    private readonly ILogger<AmadeusHotelProvider> _logger;

    public bool IsConfigured => _settings.Enabled
        && !string.IsNullOrWhiteSpace(_settings.ApiKey)
        && !string.IsNullOrWhiteSpace(_settings.ApiSecret);

    // Map city names to IATA city codes
    private static readonly Dictionary<string, string> CityCodeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["mumbai"]    = "BOM", ["delhi"]     = "DEL", ["bengaluru"] = "BLR",
        ["bangalore"] = "BLR", ["chennai"]   = "MAA", ["hyderabad"] = "HYD",
        ["ahmedabad"] = "AMD", ["goa"]       = "GOI", ["kolkata"]   = "CCU",
        ["jaipur"]    = "JAI", ["pune"]      = "PNQ", ["kochi"]     = "COK",
        ["lucknow"]   = "LKO", ["chandigarh"]= "IXC", ["amritsar"]  = "ATQ",
        ["srinagar"]  = "SXR", ["dubai"]     = "DXB", ["singapore"] = "SIN",
        ["london"]    = "LON", ["new york"]  = "NYC", ["paris"]     = "PAR",
    };

    private static readonly string[] DefaultImages =
    [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
        "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800",
    ];

    public AmadeusHotelProvider(HttpClient http, AmadeusTokenService tokenService,
        IOptions<AmadeusSettings> settings, ICacheService cache,
        ILogger<AmadeusHotelProvider> logger)
    {
        _http = http;
        _tokenService = tokenService;
        _settings = settings.Value;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<HotelDto>> SearchAsync(HotelSearchRequest req, CancellationToken ct = default)
    {
        var token = await _tokenService.GetTokenAsync(ct);
        if (token is null)
        {
            _logger.LogWarning("Amadeus token unavailable — falling back to DB hotels");
            return [];
        }

        var cityCode = CityCodeMap.TryGetValue(req.City.ToLower(), out var cc) ? cc : req.City.ToUpper();
        var checkIn  = req.CheckIn.ToString("yyyy-MM-dd");
        var checkOut = req.CheckOut.ToString("yyyy-MM-dd");
        var nights   = (req.CheckOut - req.CheckIn).Days;

        // Step 1: Get hotel list by city
        var hotelListUrl = $"{_settings.BaseUrl}/v1/reference-data/locations/hotels/by-city" +
                           $"?cityCode={cityCode}&radius=30&radiusUnit=KM&hotelSource=ALL";

        using var hotelListReq = new HttpRequestMessage(HttpMethod.Get, hotelListUrl);
        hotelListReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        List<string> hotelIds;
        try
        {
            var hotelListResp = await _http.SendAsync(hotelListReq, ct);
            if (!hotelListResp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Amadeus hotel list returned {Status}", hotelListResp.StatusCode);
                return [];
            }
            var listJson = await hotelListResp.Content.ReadAsStringAsync(ct);
            var listRoot = JsonSerializer.Deserialize<AmadeusHotelListResponse>(listJson);
            hotelIds = listRoot?.Data?.Take(20).Select(h => h.HotelId).Where(id => id != null).ToList()!
                      ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Amadeus hotel list error");
            return [];
        }

        if (hotelIds.Count == 0) return [];

        // Step 2: Get offers for those hotels
        var idsParam = string.Join(",", hotelIds.Take(10));
        var offersUrl = $"{_settings.BaseUrl}/v3/shopping/hotel-offers" +
                        $"?hotelIds={idsParam}" +
                        $"&adults={req.Guests}" +
                        $"&checkInDate={checkIn}" +
                        $"&checkOutDate={checkOut}" +
                        $"&roomQuantity=1" +
                        $"&currency=INR" +
                        $"&bestRateOnly=true";

        using var offersReq = new HttpRequestMessage(HttpMethod.Get, offersUrl);
        offersReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        try
        {
            var offersResp = await _http.SendAsync(offersReq, ct);
            if (!offersResp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Amadeus hotel offers returned {Status}", offersResp.StatusCode);
                return [];
            }

            var offersJson = await offersResp.Content.ReadAsStringAsync(ct);
            var offersRoot = JsonSerializer.Deserialize<AmadeusHotelOffersResponse>(offersJson);
            if (offersRoot?.Data is null) return [];

            var hotels = new List<HotelDto>();
            var rng = new Random();
            for (var i = 0; i < offersRoot.Data.Count; i++)
            {
                var item = offersRoot.Data[i];
                var dto  = MapHotelOffer(item, nights, i, rng);
                if (dto is null) continue;
                await _cache.SetAsync($"amadeus_hotel:{dto.Id}", item, TimeSpan.FromMinutes(30), ct);
                hotels.Add(dto);
            }
            return hotels;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Amadeus hotel offers error");
            return [];
        }
    }

    private HotelDto? MapHotelOffer(AmadeusHotelOffer item, int nights, int index, Random rng)
    {
        if (item.Hotel is null || item.Offers is null || item.Offers.Count == 0) return null;

        var hotel = item.Hotel;
        var offer = item.Offers[0];

        var pricePerNight = 0m;
        if (decimal.TryParse(offer.Price?.Total, out var total) && nights > 0)
            pricePerNight = Math.Round(total / nights, 2);

        var cancellation = offer.Policies?.Cancellations?.FirstOrDefault()?.Description?.Text
                          ?? "Non-refundable";
        var mealPlan = offer.BoardType switch
        {
            "BREAKFAST"    => "Breakfast included",
            "HALF_BOARD"   => "Half board",
            "FULL_BOARD"   => "Full board",
            "ALL_INCLUSIVE"=> "All inclusive",
            _              => "Room only"
        };

        var isRefundable = cancellation.Contains("refundable", StringComparison.OrdinalIgnoreCase)
                        && !cancellation.Contains("non-refundable", StringComparison.OrdinalIgnoreCase);

        var id = Guid.NewGuid();
        var stars = hotel.Rating is not null && decimal.TryParse(hotel.Rating, out var s) ? s : (decimal)(3 + index % 3);
        var image = DefaultImages[index % DefaultImages.Length];

        var room = new HotelRoomDto(
            Id:                  Guid.NewGuid(),
            RoomType:            offer.Room?.TypeEstimated?.Category ?? "Standard Room",
            PricePerNight:       pricePerNight,
            MaxOccupancy:        offer.Guests?.Adults ?? 2,
            AvailableRooms:      rng.Next(3, 15),
            Amenities:           "WiFi, AC, TV",
            CancellationPolicy:  cancellation,
            MealPlan:            mealPlan,
            IsRefundable:        isRefundable,
            ExternalOfferId:     offer.Id
        );

        return new HotelDto(
            Id:              id,
            Name:            hotel.Name ?? "Hotel",
            City:            hotel.CityCode ?? string.Empty,
            Address:         hotel.Address?.Lines?.FirstOrDefault() ?? hotel.CityCode ?? string.Empty,
            StarRating:      stars,
            ReviewScore:     Math.Round((decimal)(3.5 + rng.NextDouble() * 1.5), 1),
            ReviewCount:     rng.Next(50, 2000),
            Description:     $"Well-located hotel in {hotel.CityCode} offering comfortable rooms and modern amenities.",
            Amenities:       "[\"WiFi\",\"Restaurant\",\"Room Service\",\"Concierge\"]",
            ImageUrl:        image,
            Rooms:           [room],
            ExternalHotelId: hotel.HotelId,
            Latitude:        hotel.Latitude,
            Longitude:       hotel.Longitude
        );
    }

    // ── Amadeus JSON models ────────────────────────────────────────────────────

    private class AmadeusHotelListResponse
    {
        [JsonPropertyName("data")] public List<AmadeusHotelListItem>? Data { get; set; }
    }

    private class AmadeusHotelListItem
    {
        [JsonPropertyName("hotelId")] public string HotelId { get; set; } = string.Empty;
    }

    private class AmadeusHotelOffersResponse
    {
        [JsonPropertyName("data")] public List<AmadeusHotelOffer>? Data { get; set; }
    }

    private class AmadeusHotelOffer
    {
        [JsonPropertyName("hotel")]  public AmadeusHotelInfo? Hotel { get; set; }
        [JsonPropertyName("offers")] public List<AmadeusRoomOffer>? Offers { get; set; }
    }

    private class AmadeusHotelInfo
    {
        [JsonPropertyName("hotelId")]  public string? HotelId { get; set; }
        [JsonPropertyName("name")]     public string? Name { get; set; }
        [JsonPropertyName("cityCode")] public string? CityCode { get; set; }
        [JsonPropertyName("rating")]   public string? Rating { get; set; }
        [JsonPropertyName("latitude")] public double? Latitude { get; set; }
        [JsonPropertyName("longitude")]public double? Longitude { get; set; }
        [JsonPropertyName("address")]  public AmadeusAddress? Address { get; set; }
    }

    private class AmadeusAddress
    {
        [JsonPropertyName("lines")]   public List<string>? Lines { get; set; }
        [JsonPropertyName("cityName")]public string? CityName { get; set; }
        [JsonPropertyName("postalCode")]public string? PostalCode { get; set; }
        [JsonPropertyName("countryCode")]public string? CountryCode { get; set; }
    }

    private class AmadeusRoomOffer
    {
        [JsonPropertyName("id")]        public string? Id { get; set; }
        [JsonPropertyName("price")]     public AmadeusOfferPrice? Price { get; set; }
        [JsonPropertyName("room")]      public AmadeusRoom? Room { get; set; }
        [JsonPropertyName("guests")]    public AmadeusGuests? Guests { get; set; }
        [JsonPropertyName("boardType")] public string? BoardType { get; set; }
        [JsonPropertyName("policies")]  public AmadeusOfferPolicies? Policies { get; set; }
    }

    private class AmadeusOfferPrice
    {
        [JsonPropertyName("currency")] public string? Currency { get; set; }
        [JsonPropertyName("total")]    public string? Total { get; set; }
        [JsonPropertyName("base")]     public string? Base { get; set; }
    }

    private class AmadeusRoom
    {
        [JsonPropertyName("typeEstimated")] public AmadeusRoomType? TypeEstimated { get; set; }
    }

    private class AmadeusRoomType
    {
        [JsonPropertyName("category")]  public string? Category { get; set; }
        [JsonPropertyName("beds")]      public int? Beds { get; set; }
        [JsonPropertyName("bedType")]   public string? BedType { get; set; }
    }

    private class AmadeusGuests
    {
        [JsonPropertyName("adults")] public int Adults { get; set; }
    }

    private class AmadeusOfferPolicies
    {
        [JsonPropertyName("cancellations")] public List<AmadeusCancellationPolicy>? Cancellations { get; set; }
        [JsonPropertyName("paymentType")]   public string? PaymentType { get; set; }
    }

    private class AmadeusCancellationPolicy
    {
        [JsonPropertyName("description")] public AmadeusDescription? Description { get; set; }
    }

    private class AmadeusDescription
    {
        [JsonPropertyName("text")] public string? Text { get; set; }
    }
}
