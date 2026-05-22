using TravelPort.Application.DTOs.Transport;
using TravelPort.Application.Validators.Transport;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookCabRequestValidatorTests
{
    private readonly BookCabRequestValidator _validator = new();

    private static readonly DateTime _pickup = DateTime.UtcNow.Date.AddDays(1).AddHours(10);

    private static BookCabRequest ValidRequest() => new(
        CabId:          "CAB001",
        Provider:       "Ola",
        CabType:        "Sedan",
        CarModel:       "Toyota Etios",
        Origin:         "Mumbai Airport",
        Destination:    "Bandra",
        PickupDateTime: _pickup,
        DurationMinutes: 45,
        DistanceKm:     25.5,
        Price:          350m,
        CouponCode:     null,
        UseWallet:      false,
        SavedCardId:    null,
        GuestName:      "Rahul Gupta",
        GuestEmail:     "rahul@example.com",
        GuestPhone:     "9876543210",
        PickupAddress:  "Terminal 2, CSIA",
        CompanyPhone:   null,
        DriverRating:   4.5m
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
            CouponCode    = null,
            GuestName     = null,
            GuestEmail    = null,
            GuestPhone    = null,
            PickupAddress = null,
            CompanyPhone  = null,
            DriverRating  = null,
        };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0.0)]
    [InlineData(2.5)]
    [InlineData(5.0)]
    public void Validator_AcceptsValidDriverRatings(double rating)
    {
        var req = ValidRequest() with { DriverRating = (decimal)rating };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0.1)]
    [InlineData(10.0)]
    [InlineData(500.0)]
    public void Validator_AcceptsPositiveDistanceKm(double distance)
    {
        var req = ValidRequest() with { DistanceKm = distance };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(100.0)]
    [InlineData(350.0)]
    [InlineData(5000.0)]
    public void Validator_AcceptsPositivePrice(double price)
    {
        var req = ValidRequest() with { Price = (decimal)price };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("cab.rider@travel.in")]
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
    public void Validator_RejectsEmptyCabId()
    {
        var req = ValidRequest() with { CabId = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.CabId));
    }

    [Fact]
    public void Validator_RejectsEmptyProvider()
    {
        var req = ValidRequest() with { Provider = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.Provider));
    }

    [Fact]
    public void Validator_RejectsEmptyCabType()
    {
        var req = ValidRequest() with { CabType = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.CabType));
    }

    [Fact]
    public void Validator_RejectsEmptyCarModel()
    {
        var req = ValidRequest() with { CarModel = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.CarModel));
    }

    [Fact]
    public void Validator_RejectsEmptyOrigin()
    {
        var req = ValidRequest() with { Origin = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.Origin));
    }

    [Fact]
    public void Validator_RejectsEmptyDestination()
    {
        var req = ValidRequest() with { Destination = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.Destination));
    }

    // ── Negative tests — distance ─────────────────────────────────────────────

    [Theory]
    [InlineData(0.0)]
    [InlineData(-1.0)]
    [InlineData(-100.0)]
    public void Validator_RejectsNonPositiveDistanceKm(double distance)
    {
        var req = ValidRequest() with { DistanceKm = distance };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.DistanceKm));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.Price));
    }

    // ── Negative tests — driver rating ────────────────────────────────────────

    [Theory]
    [InlineData(-0.1)]
    [InlineData(-1.0)]
    [InlineData(5.1)]
    [InlineData(10.0)]
    public void Validator_RejectsDriverRatingOutOfRange(double rating)
    {
        var req = ValidRequest() with { DriverRating = (decimal)rating };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.DriverRating));
    }

    [Fact]
    public void Validator_AcceptsNullDriverRating()
    {
        var req = ValidRequest() with { DriverRating = null };
        Assert.True(_validator.Validate(req).IsValid);
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.GuestEmail));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookCabRequest.GuestPhone));
    }
}
