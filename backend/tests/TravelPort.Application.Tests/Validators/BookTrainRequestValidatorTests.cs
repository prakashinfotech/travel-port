using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Validators.Transport;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookTrainRequestValidatorTests
{
    private readonly BookTrainRequestValidator _validator = new();

    private static readonly DateTime _departure = DateTime.UtcNow.Date.AddDays(2).AddHours(6);
    private static readonly DateTime _arrival   = DateTime.UtcNow.Date.AddDays(2).AddHours(20);

    private static BookTrainRequest ValidRequest() => new(
        TrainId:        "TRAIN001",
        TrainNumber:    "12951",
        TrainName:      "Rajdhani Express",
        Class:          "2A",
        Origin:         "Mumbai",
        Destination:    "Delhi",
        DepartureTime:  _departure,
        ArrivalTime:    _arrival,
        DurationMinutes: 840,
        Price:          1500m,
        Passengers:     2,
        CouponCode:     null,
        UseWallet:      false,
        SavedCardId:    null,
        GuestName:      "Priya Sharma",
        GuestEmail:     "priya@example.com",
        GuestPhone:     "9876543210"
    );

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Fact]
    public void Validator_AcceptsRequestWithNullOptionalFields()
    {
        var req = ValidRequest() with
        {
            CouponCode = null,
            GuestName  = null,
            GuestEmail = null,
            GuestPhone = null,
        };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(9)]
    public void Validator_AcceptsValidPassengerCounts(int passengers)
    {
        var req = ValidRequest() with { Passengers = passengers };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("1A")]
    [InlineData("2A")]
    [InlineData("3A")]
    [InlineData("SL")]
    [InlineData("CC")]
    public void Validator_AcceptsValidClasses(string cls)
    {
        var req = ValidRequest() with { Class = cls };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(100.0)]
    [InlineData(1500.0)]
    [InlineData(9999.0)]
    public void Validator_AcceptsPositivePrice(double price)
    {
        var req = ValidRequest() with { Price = (decimal)price };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("traveller+train@mail.in")]
    public void Validator_AcceptsValidGuestEmails(string email)
    {
        var req = ValidRequest() with { GuestEmail = email };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("9876543210")]
    [InlineData("7000000001")]
    public void Validator_AcceptsValidGuestPhones(string phone)
    {
        var req = ValidRequest() with { GuestPhone = phone };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — required string fields ───────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyTrainId()
    {
        var req = ValidRequest() with { TrainId = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.TrainId));
    }

    [Fact]
    public void Validator_RejectsEmptyTrainNumber()
    {
        var req = ValidRequest() with { TrainNumber = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.TrainNumber));
    }

    [Fact]
    public void Validator_RejectsEmptyTrainName()
    {
        var req = ValidRequest() with { TrainName = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.TrainName));
    }

    [Fact]
    public void Validator_RejectsEmptyClass()
    {
        var req = ValidRequest() with { Class = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.Class));
    }

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var req = ValidRequest() with { Origin = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var req = ValidRequest() with { Destination = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.Destination));
    }

    // ── Negative tests — times ────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsArrivalBeforeDeparture()
    {
        var req = ValidRequest() with { ArrivalTime = _departure.AddHours(-1) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.ArrivalTime));
    }

    [Fact]
    public void Validator_RejectsArrivalEqualToDeparture()
    {
        var req = ValidRequest() with { ArrivalTime = _departure };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.ArrivalTime));
    }

    // ── Negative tests — price ────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-500)]
    public void Validator_RejectsNonPositivePrice(decimal price)
    {
        var req = ValidRequest() with { Price = price };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.Price));
    }

    // ── Negative tests — passengers ───────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10)]
    [InlineData(100)]
    public void Validator_RejectsPassengerCountOutOfRange(int passengers)
    {
        var req = ValidRequest() with { Passengers = passengers };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.Passengers));
    }

    // ── Negative tests — email ────────────────────────────────────────────────

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nodomain.com")]
    public void Validator_RejectsInvalidGuestEmail(string email)
    {
        var req = ValidRequest() with { GuestEmail = email };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.GuestEmail));
    }

    // ── Negative tests — phone ────────────────────────────────────────────────

    [Theory]
    [InlineData("123")]          // too short
    [InlineData("12345678901")]  // too long
    [InlineData("abcdefghij")]   // letters
    [InlineData("98765-43210")]  // hyphen
    public void Validator_RejectsInvalidGuestPhone(string phone)
    {
        var req = ValidRequest() with { GuestPhone = phone };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookTrainRequest.GuestPhone));
    }
}
