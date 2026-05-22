using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Validators.Transport;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookBusRequestValidatorTests
{
    private readonly BookBusRequestValidator _validator = new();

    private static readonly DateTime _departure = DateTime.UtcNow.Date.AddDays(1).AddHours(8);
    private static readonly DateTime _arrival   = DateTime.UtcNow.Date.AddDays(1).AddHours(14);

    private static BookBusRequest ValidRequest() => new(
        BusId:          "BUS001",
        Operator:       "RedBus Express",
        BusType:        "AC Sleeper",
        Origin:         "Mumbai",
        Destination:    "Pune",
        DepartureTime:  _departure,
        ArrivalTime:    _arrival,
        DurationMinutes: 360,
        Price:          500m,
        Amenities:      "WiFi, USB",
        Seats:          2,
        CouponCode:     null,
        UseWallet:      false,
        SavedCardId:    null,
        GuestName:      "John Doe",
        GuestEmail:     "john@example.com",
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
            CouponCode  = null,
            GuestName   = null,
            GuestEmail  = null,
            GuestPhone  = null,
            BoardingPoint  = null,
            DroppingPoint  = null,
        };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public void Validator_AcceptsValidSeatCounts(int seats)
    {
        var req = ValidRequest() with { Seats = seats };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(500.0)]
    [InlineData(9999.99)]
    public void Validator_AcceptsPositivePrice(double price)
    {
        var req = ValidRequest() with { Price = (decimal)price };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("guest+bus@travel.co.in")]
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
    public void Validator_RejectsEmptyBusId()
    {
        var req = ValidRequest() with { BusId = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.BusId));
    }

    [Fact]
    public void Validator_RejectsEmptyOperator()
    {
        var req = ValidRequest() with { Operator = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.Operator));
    }

    [Fact]
    public void Validator_RejectsEmptyBusType()
    {
        var req = ValidRequest() with { BusType = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.BusType));
    }

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var req = ValidRequest() with { Origin = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var req = ValidRequest() with { Destination = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.Destination));
    }

    // ── Negative tests — times ────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsArrivalBeforeDeparture()
    {
        var req = ValidRequest() with { ArrivalTime = _departure.AddHours(-1) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.ArrivalTime));
    }

    [Fact]
    public void Validator_RejectsArrivalEqualToDeparture()
    {
        var req = ValidRequest() with { ArrivalTime = _departure };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.ArrivalTime));
    }

    // ── Negative tests — price ────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-999)]
    public void Validator_RejectsNonPositivePrice(decimal price)
    {
        var req = ValidRequest() with { Price = price };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.Price));
    }

    // ── Negative tests — seats ────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(11)]
    [InlineData(50)]
    public void Validator_RejectsSeatCountOutOfRange(int seats)
    {
        var req = ValidRequest() with { Seats = seats };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.Seats));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.GuestEmail));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookBusRequest.GuestPhone));
    }
}
