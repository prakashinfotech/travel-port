using TravelPort.Application.DTOs.Flights;
using TravelPort.Application.Validators.Flights;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookFlightRequestValidatorTests
{
    private readonly BookFlightRequestValidator _validator = new();

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Economy")]
    [InlineData("Business")]
    public void Validator_AcceptsSupportedCabinClasses(string cabinClass)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), 1, cabinClass);
        Assert.True(_validator.Validate(request).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(5)]
    [InlineData(9)]
    public void Validator_AcceptsPassengerCountInValidRange(int passengers)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), passengers, "Economy");
        Assert.True(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void Validator_AcceptsSupportedCabinClassAndPassengerRange()
    {
        var request = new BookFlightRequest(Guid.NewGuid(), 2, "Business");
        Assert.True(_validator.Validate(request).IsValid);
    }

    // ── Negative tests — cabin class ──────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("PremiumEconomy")]
    [InlineData("First")]
    [InlineData("economy")]       // case sensitive
    [InlineData("BUSINESS")]      // case sensitive
    [InlineData("invalid")]
    public void Validator_RejectsUnsupportedCabinClass(string cabinClass)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), 2, cabinClass);
        var result = _validator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookFlightRequest.CabinClass));
    }

    // ── Negative tests — passenger count ──────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10)]
    [InlineData(100)]
    public void Validator_RejectsPassengerCountOutsideSupportedRange(int passengers)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), passengers);
        var result = _validator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookFlightRequest.Passengers));
    }

    // ── Negative tests — flight id ────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyFlightId()
    {
        var request = new BookFlightRequest(Guid.Empty, 2, "Economy");
        var result = _validator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookFlightRequest.FlightId));
    }
}
