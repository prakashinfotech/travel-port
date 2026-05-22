using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.DTOs.Payments;
using TravelPort.Application.Validators.Operator;
using TravelPort.Application.Validators.Payments;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

// ── InitiatePaymentRequest ──────────────────────────────────────────────────

public class InitiatePaymentRequestValidatorTests
{
    private readonly InitiatePaymentRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsValidRequest()
        => Assert.True(_validator.Validate(new InitiatePaymentRequest(Guid.NewGuid())).IsValid);

    [Fact]
    public void Validator_RejectsEmptyBookingId()
    {
        var result = _validator.Validate(new InitiatePaymentRequest(Guid.Empty));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(InitiatePaymentRequest.BookingId));
    }
}

// ── VerifyPaymentRequest ────────────────────────────────────────────────────

public class VerifyPaymentRequestValidatorTests
{
    private readonly VerifyPaymentRequestValidator _validator = new();

    private static VerifyPaymentRequest ValidRequest() => new(
        BookingId:           Guid.NewGuid(),
        RazorpayOrderId:     "order_abc123",
        RazorpayPaymentId:   "pay_xyz789",
        RazorpaySignature:   "sha256sig"
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_RejectsEmptyBookingId()
    {
        var result = _validator.Validate(ValidRequest() with { BookingId = Guid.Empty });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(VerifyPaymentRequest.BookingId));
    }

    [Fact]
    public void Validator_RejectsEmptyOrderId()
    {
        var result = _validator.Validate(ValidRequest() with { RazorpayOrderId = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(VerifyPaymentRequest.RazorpayOrderId));
    }

    [Fact]
    public void Validator_RejectsEmptyPaymentId()
    {
        var result = _validator.Validate(ValidRequest() with { RazorpayPaymentId = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(VerifyPaymentRequest.RazorpayPaymentId));
    }

    [Fact]
    public void Validator_RejectsEmptySignature()
    {
        var result = _validator.Validate(ValidRequest() with { RazorpaySignature = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(VerifyPaymentRequest.RazorpaySignature));
    }
}

// ── CreateFlightRequest ─────────────────────────────────────────────────────

public class CreateFlightRequestValidatorTests
{
    private readonly CreateFlightRequestValidator _validator = new();

    private static readonly DateTime _dep = DateTime.UtcNow.Date.AddDays(5).AddHours(6);
    private static readonly DateTime _arr = DateTime.UtcNow.Date.AddDays(5).AddHours(8);

    private static CreateFlightRequest ValidRequest() => new(
        FlightNumber:             "6E-101",
        Source:                   "Mumbai",
        Destination:              "Delhi",
        DepartureTime:            _dep,
        ArrivalTime:              _arr,
        TotalSeats:               180,
        EconomyPrice:             4500m,
        BusinessPrice:            null,
        Stops:                    0,
        LayoverAirport:           null,
        LayoverDurationMinutes:   null,
        SeatLayoutConfig:         "3-3",
        SeatRows:                 30,
        LadiesSeats:              null
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_AcceptsFlightWithBusinessPrice()
        => Assert.True(_validator.Validate(ValidRequest() with { BusinessPrice = 12000m }).IsValid);

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void Validator_AcceptsValidStops(int stops)
        => Assert.True(_validator.Validate(ValidRequest() with { Stops = stops }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyFlightNumber()
    {
        var result = _validator.Validate(ValidRequest() with { FlightNumber = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.FlightNumber));
    }

    [Fact]
    public void Validator_RejectsEmptySource()
    {
        var result = _validator.Validate(ValidRequest() with { Source = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.Source));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var result = _validator.Validate(ValidRequest() with { Destination = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.Destination));
    }

    [Fact]
    public void Validator_RejectsArrivalBeforeDeparture()
    {
        var req = ValidRequest() with { ArrivalTime = _dep.AddHours(-1) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.ArrivalTime));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(501)]
    public void Validator_RejectsInvalidTotalSeats(int seats)
    {
        var result = _validator.Validate(ValidRequest() with { TotalSeats = seats });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.TotalSeats));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validator_RejectsNonPositiveEconomyPrice(decimal price)
    {
        var result = _validator.Validate(ValidRequest() with { EconomyPrice = price });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.EconomyPrice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public void Validator_RejectsNonPositiveBusinessPrice(decimal price)
    {
        var result = _validator.Validate(ValidRequest() with { BusinessPrice = price });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.BusinessPrice));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(3)]
    [InlineData(5)]
    public void Validator_RejectsInvalidStops(int stops)
    {
        var result = _validator.Validate(ValidRequest() with { Stops = stops });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateFlightRequest.Stops));
    }
}
