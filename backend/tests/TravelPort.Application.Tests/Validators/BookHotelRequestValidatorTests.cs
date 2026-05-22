using TravelPort.Application.DTOs.Hotels;
using TravelPort.Application.Validators.Hotels;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookHotelRequestValidatorTests
{
    private readonly BookHotelRequestValidator _validator = new();

    private static readonly DateTime _tomorrow = DateTime.UtcNow.Date.AddDays(1);
    private static readonly DateTime _dayAfter = DateTime.UtcNow.Date.AddDays(3);

    private static BookHotelRequest ValidRequest() => new(
        HotelId: Guid.NewGuid(),
        RoomId: Guid.NewGuid(),
        CheckIn: _tomorrow,
        CheckOut: _dayAfter,
        Guests: 2,
        CouponCode: null,
        UseWallet: false,
        SavedCardId: null,
        GuestName: "Jane Doe",
        GuestEmail: "jane@example.com",
        GuestPhone: "9876543210",
        MealPlan: null,
        MealPlanAmountPerNight: 0
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
            GuestName = null,
            GuestEmail = null,
            GuestPhone = null,
            MealPlan = null,
        };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(10)]
    [InlineData(20)]
    public void Validator_AcceptsValidGuestCounts(int guests)
    {
        var req = ValidRequest() with { Guests = guests };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("guest+booking@hotel.co.in")]
    [InlineData("first.last@domain.org")]
    public void Validator_AcceptsValidGuestEmails(string email)
    {
        var req = ValidRequest() with { GuestEmail = email };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("9876543210")]
    [InlineData("7000000001")]
    [InlineData("1234567890")]
    public void Validator_AcceptsValidGuestPhones(string phone)
    {
        var req = ValidRequest() with { GuestPhone = phone };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsZeroMealPlanAmount()
    {
        var req = ValidRequest() with { MealPlanAmountPerNight = 0m };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — IDs ───────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyHotelId()
    {
        var req = ValidRequest() with { HotelId = Guid.Empty };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.HotelId));
    }

    [Fact]
    public void Validator_RejectsEmptyRoomId()
    {
        var req = ValidRequest() with { RoomId = Guid.Empty };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.RoomId));
    }

    // ── Negative tests — dates ────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsCheckOutBeforeCheckIn()
    {
        var req = ValidRequest() with { CheckOut = _tomorrow.AddHours(-1) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.CheckOut));
    }

    [Fact]
    public void Validator_RejectsCheckOutEqualToCheckIn()
    {
        var req = ValidRequest() with { CheckIn = _tomorrow, CheckOut = _tomorrow };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.CheckOut));
    }

    // ── Negative tests — guests ───────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(21)]
    [InlineData(100)]
    public void Validator_RejectsGuestCountOutOfRange(int guests)
    {
        var req = ValidRequest() with { Guests = guests };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.Guests));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.GuestEmail));
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
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.GuestPhone));
    }

    // ── Negative tests — meal plan ────────────────────────────────────────────

    [Theory]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Validator_RejectsNegativeMealPlanAmount(decimal amount)
    {
        var req = ValidRequest() with { MealPlanAmountPerNight = amount };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookHotelRequest.MealPlanAmountPerNight));
    }
}
