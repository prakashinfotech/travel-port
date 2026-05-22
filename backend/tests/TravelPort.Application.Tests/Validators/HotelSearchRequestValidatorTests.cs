using TravelPort.Application.DTOs.Hotels;
using TravelPort.Application.Validators.Hotels;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class HotelSearchRequestValidatorTests
{
    private readonly HotelSearchRequestValidator _validator = new();

    private static readonly DateTime _checkIn  = DateTime.UtcNow.Date.AddDays(5);
    private static readonly DateTime _checkOut = DateTime.UtcNow.Date.AddDays(8);

    private static HotelSearchRequest ValidRequest() => new(
        City:       "Goa",
        CheckIn:    _checkIn,
        CheckOut:   _checkOut,
        Guests:     2,
        MinPrice:   null,
        MaxPrice:   null,
        StarRating: 0,
        SortBy:     "price",
        Page:       1,
        PageSize:   10
    );

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Fact]
    public void Validator_AcceptsNullPriceFilters()
    {
        var req = ValidRequest() with { MinPrice = null, MaxPrice = null };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(5)]
    public void Validator_AcceptsValidStarRatings(int stars)
    {
        var req = ValidRequest() with { StarRating = stars };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("price")]
    [InlineData("rating")]
    [InlineData("name")]
    [InlineData("stars")]
    public void Validator_AcceptsValidSortBy(string sort)
    {
        var req = ValidRequest() with { SortBy = sort };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsMinAndMaxPriceTogether()
    {
        var req = ValidRequest() with { MinPrice = 500m, MaxPrice = 5000m };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — required fields ──────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyCity()
    {
        var req = ValidRequest() with { City = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.City));
    }

    [Fact]
    public void Validator_RejectsCheckOutBeforeCheckIn()
    {
        var req = ValidRequest() with { CheckOut = _checkIn.AddHours(-1) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.CheckOut));
    }

    [Fact]
    public void Validator_RejectsCheckOutEqualToCheckIn()
    {
        var req = ValidRequest() with { CheckIn = _checkIn, CheckOut = _checkIn };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.CheckOut));
    }

    // ── Negative tests — guests ────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(21)]
    public void Validator_RejectsInvalidGuestCount(int guests)
    {
        var req = ValidRequest() with { Guests = guests };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.Guests));
    }

    // ── Negative tests — price filters ────────────────────────────────────────

    [Fact]
    public void Validator_RejectsNegativeMinPrice()
    {
        var req = ValidRequest() with { MinPrice = -1m };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.MinPrice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validator_RejectsNonPositiveMaxPrice(decimal price)
    {
        var req = ValidRequest() with { MaxPrice = price };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.MaxPrice));
    }

    // ── Negative tests — star rating ───────────────────────────────────────────

    [Theory]
    [InlineData(-1)]
    [InlineData(6)]
    public void Validator_RejectsInvalidStarRating(int stars)
    {
        var req = ValidRequest() with { StarRating = stars };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.StarRating));
    }

    // ── Negative tests — sort ──────────────────────────────────────────────────

    [Theory]
    [InlineData("cheapest")]
    [InlineData("newest")]
    public void Validator_RejectsInvalidSortBy(string sort)
    {
        var req = ValidRequest() with { SortBy = sort };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.SortBy));
    }

    // ── Negative tests — pagination ────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidPage(int page)
    {
        var req = ValidRequest() with { Page = page };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.Page));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    public void Validator_RejectsInvalidPageSize(int size)
    {
        var req = ValidRequest() with { PageSize = size };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(HotelSearchRequest.PageSize));
    }
}
