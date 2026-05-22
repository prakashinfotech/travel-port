using TravelPort.Application.DTOs.Flights;
using TravelPort.Application.Validators.Flights;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class FlightSearchRequestValidatorTests
{
    private readonly FlightSearchRequestValidator _validator = new();

    private static FlightSearchRequest ValidRequest() => new(
        Origin:        "Mumbai",
        Destination:   "Delhi",
        DepartureDate: DateTime.UtcNow.Date.AddDays(3),
        Passengers:    1,
        CabinClass:    "Economy",
        SortBy:        "price",
        MaxPrice:      null,
        MaxStops:      null,
        Airlines:      null,
        Page:          1,
        PageSize:      20
    );

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Theory]
    [InlineData("Economy")]
    [InlineData("Business")]
    public void Validator_AcceptsValidCabinClasses(string cabin)
    {
        var req = ValidRequest() with { CabinClass = cabin };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("price")]
    [InlineData("duration")]
    [InlineData("departure")]
    [InlineData("arrival")]
    public void Validator_AcceptsValidSortBy(string sort)
    {
        var req = ValidRequest() with { SortBy = sort };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(9)]
    public void Validator_AcceptsValidPassengerCounts(int p)
    {
        var req = ValidRequest() with { Passengers = p };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void Validator_AcceptsValidMaxStops(int stops)
    {
        var req = ValidRequest() with { MaxStops = stops };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsNullOptionalFilters()
    {
        var req = ValidRequest() with { MaxPrice = null, MaxStops = null, Airlines = null };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — required fields ──────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var req = ValidRequest() with { Origin = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var req = ValidRequest() with { Destination = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.Destination));
    }

    // ── Negative tests — passengers ────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10)]
    public void Validator_RejectsInvalidPassengerCount(int p)
    {
        var req = ValidRequest() with { Passengers = p };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.Passengers));
    }

    // ── Negative tests — cabin class ───────────────────────────────────────────

    [Theory]
    [InlineData("First")]
    [InlineData("economy")]
    [InlineData("ECONOMY")]
    public void Validator_RejectsInvalidCabinClass(string cabin)
    {
        var req = ValidRequest() with { CabinClass = cabin };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.CabinClass));
    }

    // ── Negative tests — sort ──────────────────────────────────────────────────

    [Theory]
    [InlineData("rating")]
    [InlineData("cheapest")]
    public void Validator_RejectsInvalidSortBy(string sort)
    {
        var req = ValidRequest() with { SortBy = sort };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.SortBy));
    }

    // ── Negative tests — MaxPrice ──────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validator_RejectsNonPositiveMaxPrice(int price)
    {
        var req = ValidRequest() with { MaxPrice = price };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.MaxPrice));
    }

    // ── Negative tests — MaxStops ──────────────────────────────────────────────

    [Theory]
    [InlineData(-1)]
    [InlineData(3)]
    public void Validator_RejectsInvalidMaxStops(int stops)
    {
        var req = ValidRequest() with { MaxStops = stops };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.MaxStops));
    }

    // ── Negative tests — pagination ────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidPage(int page)
    {
        var req = ValidRequest() with { Page = page };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.Page));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Validator_RejectsInvalidPageSize(int size)
    {
        var req = ValidRequest() with { PageSize = size };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(FlightSearchRequest.PageSize));
    }
}
