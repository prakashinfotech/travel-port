using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Validators.Transport;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

// ── BusSearchRequest ────────────────────────────────────────────────────────

public class BusSearchRequestValidatorTests
{
    private readonly BusSearchRequestValidator _validator = new();

    private static BusSearchRequest ValidRequest() => new(
        Origin:      "Pune",
        Destination: "Mumbai",
        TravelDate:  DateTime.UtcNow.Date.AddDays(2),
        Seats:       1,
        Page:        1,
        PageSize:    20
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public void Validator_AcceptsValidSeatCounts(int seats)
        => Assert.True(_validator.Validate(ValidRequest() with { Seats = seats }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var result = _validator.Validate(ValidRequest() with { Origin = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BusSearchRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var result = _validator.Validate(ValidRequest() with { Destination = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BusSearchRequest.Destination));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(11)]
    public void Validator_RejectsInvalidSeatCount(int seats)
    {
        var result = _validator.Validate(ValidRequest() with { Seats = seats });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BusSearchRequest.Seats));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidPage(int page)
    {
        var result = _validator.Validate(ValidRequest() with { Page = page });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BusSearchRequest.Page));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Validator_RejectsInvalidPageSize(int size)
    {
        var result = _validator.Validate(ValidRequest() with { PageSize = size });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BusSearchRequest.PageSize));
    }
}

// ── CabSearchRequest ────────────────────────────────────────────────────────

public class CabSearchRequestValidatorTests
{
    private readonly CabSearchRequestValidator _validator = new();

    private static CabSearchRequest ValidRequest() => new(
        Origin:          "Mumbai Airport",
        Destination:     "Bandra",
        PickupDateTime:  DateTime.UtcNow.Date.AddDays(1).AddHours(10),
        TripType:        "OneWay",
        Page:            1,
        PageSize:        20
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Theory]
    [InlineData("OneWay")]
    [InlineData("Outstation")]
    [InlineData("Rental")]
    public void Validator_AcceptsValidTripTypes(string type)
        => Assert.True(_validator.Validate(ValidRequest() with { TripType = type }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var result = _validator.Validate(ValidRequest() with { Origin = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CabSearchRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var result = _validator.Validate(ValidRequest() with { Destination = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CabSearchRequest.Destination));
    }

    [Theory]
    [InlineData("oneway")]   // wrong case
    [InlineData("shared")]
    [InlineData("unknown")]
    public void Validator_RejectsInvalidTripType(string type)
    {
        var result = _validator.Validate(ValidRequest() with { TripType = type });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CabSearchRequest.TripType));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidPage(int page)
    {
        var result = _validator.Validate(ValidRequest() with { Page = page });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CabSearchRequest.Page));
    }
}

// ── TrainSearchRequest ──────────────────────────────────────────────────────

public class TrainSearchRequestValidatorTests
{
    private readonly TrainSearchRequestValidator _validator = new();

    private static TrainSearchRequest ValidRequest() => new(
        Origin:      "Mumbai",
        Destination: "Delhi",
        TravelDate:  DateTime.UtcNow.Date.AddDays(3),
        Class:       "SL",
        Passengers:  2,
        Page:        1,
        PageSize:    20
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(9)]
    public void Validator_AcceptsValidPassengerCounts(int p)
        => Assert.True(_validator.Validate(ValidRequest() with { Passengers = p }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var result = _validator.Validate(ValidRequest() with { Origin = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TrainSearchRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var result = _validator.Validate(ValidRequest() with { Destination = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TrainSearchRequest.Destination));
    }

    [Fact]
    public void Validator_RejectsEmptyClass()
    {
        var result = _validator.Validate(ValidRequest() with { Class = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TrainSearchRequest.Class));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10)]
    public void Validator_RejectsInvalidPassengerCount(int p)
    {
        var result = _validator.Validate(ValidRequest() with { Passengers = p });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TrainSearchRequest.Passengers));
    }
}

// ── SeatLockRequest ─────────────────────────────────────────────────────────

public class SeatLockRequestValidatorTests
{
    private readonly SeatLockRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsSingleSeat()
        => Assert.True(_validator.Validate(new SeatLockRequest(["A1"])).IsValid);

    [Fact]
    public void Validator_AcceptsMultipleSeats()
        => Assert.True(_validator.Validate(new SeatLockRequest(["A1", "A2", "B3"])).IsValid);

    [Fact]
    public void Validator_AcceptsTenSeats()
        => Assert.True(_validator.Validate(new SeatLockRequest(["A1","A2","A3","A4","A5","B1","B2","B3","B4","B5"])).IsValid);

    [Fact]
    public void Validator_RejectsEmptySeatArray()
    {
        var result = _validator.Validate(new SeatLockRequest([]));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_RejectsMoreThanTenSeats()
    {
        var seats = Enumerable.Range(1, 11).Select(i => $"A{i}").ToArray();
        var result = _validator.Validate(new SeatLockRequest(seats));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_RejectsEmptySeatNumber()
    {
        var result = _validator.Validate(new SeatLockRequest(["A1", "", "B2"]));
        Assert.False(result.IsValid);
    }
}
