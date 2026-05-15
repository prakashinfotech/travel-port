using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Validators.Admin;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class RegisterHotelRequestValidatorTests
{
    private readonly RegisterHotelRequestValidator _validator = new();

    private static RegisterHotelRequest ValidRequest() => new(
        HotelName: "Grand Hyatt Mumbai",
        City: "Mumbai",
        Address: "Off Western Express Highway, Santacruz East",
        StarRating: 5m,
        ManagerEmail: "manager@grandhyatt.com",
        ManagerPassword: "Hotel@123",
        ManagerName: "Rajesh Kumar"
    );

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        var result = _validator.Validate(ValidRequest());
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.5)]
    [InlineData(3.0)]
    [InlineData(4.5)]
    [InlineData(5.0)]
    public void Validator_AcceptsValidStarRatings(double rating)
    {
        var req = ValidRequest() with { StarRating = (decimal)rating };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("Economy@12")]
    [InlineData("Secure#Pass1")]
    [InlineData("Ab1!Ab1!")]
    public void Validator_AcceptsStrongPasswords(string password)
    {
        var req = ValidRequest() with { ManagerPassword = password };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    // ── Negative tests — required fields ──────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyHotelName()
    {
        var req = ValidRequest() with { HotelName = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.HotelName));
    }

    [Fact]
    public void Validator_RejectsEmptyCity()
    {
        var req = ValidRequest() with { City = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.City));
    }

    [Fact]
    public void Validator_RejectsEmptyAddress()
    {
        var req = ValidRequest() with { Address = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.Address));
    }

    [Fact]
    public void Validator_RejectsEmptyManagerName()
    {
        var req = ValidRequest() with { ManagerName = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerName));
    }

    // ── Negative tests — star rating ──────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(6)]
    [InlineData(10)]
    public void Validator_RejectsStarRatingOutOfRange(double rating)
    {
        var req = ValidRequest() with { StarRating = (decimal)rating };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.StarRating));
    }

    // ── Negative tests — manager email ────────────────────────────────────────

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("@nodomain")]
    [InlineData("missing@")]
    [InlineData("")]
    public void Validator_RejectsInvalidManagerEmail(string email)
    {
        var req = ValidRequest() with { ManagerEmail = email };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerEmail));
    }

    // ── Negative tests — password rules ──────────────────────────────────────

    [Fact]
    public void Validator_RejectsPasswordTooShort()
    {
        var req = ValidRequest() with { ManagerPassword = "Ab1!" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerPassword));
    }

    [Fact]
    public void Validator_RejectsPasswordWithNoUppercase()
    {
        var req = ValidRequest() with { ManagerPassword = "hotel@123" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerPassword));
    }

    [Fact]
    public void Validator_RejectsPasswordWithNoLowercase()
    {
        var req = ValidRequest() with { ManagerPassword = "HOTEL@123" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerPassword));
    }

    [Fact]
    public void Validator_RejectsPasswordWithNoDigit()
    {
        var req = ValidRequest() with { ManagerPassword = "Hotel@abc" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerPassword));
    }

    [Fact]
    public void Validator_RejectsPasswordWithNoSpecialChar()
    {
        var req = ValidRequest() with { ManagerPassword = "Hotel1234" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.ManagerPassword));
    }

    // ── Negative tests — field length limits ──────────────────────────────────

    [Fact]
    public void Validator_RejectsHotelNameExceedingMaxLength()
    {
        var req = ValidRequest() with { HotelName = new string('A', 201) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.HotelName));
    }

    [Fact]
    public void Validator_RejectsCityExceedingMaxLength()
    {
        var req = ValidRequest() with { City = new string('B', 101) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.City));
    }

    [Fact]
    public void Validator_RejectsAddressExceedingMaxLength()
    {
        var req = ValidRequest() with { Address = new string('C', 501) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterHotelRequest.Address));
    }
}
