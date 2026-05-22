using TravelPort.Application.DTOs.Users;
using TravelPort.Application.Validators.Users;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

// ── UpdateProfileRequest ────────────────────────────────────────────────────

public class UpdateProfileRequestValidatorTests
{
    private readonly UpdateProfileRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsValidRequest()
        => Assert.True(_validator.Validate(new UpdateProfileRequest("Jane Doe", "9876543210")).IsValid);

    [Fact]
    public void Validator_AcceptsNullPhone()
        => Assert.True(_validator.Validate(new UpdateProfileRequest("Jane Doe", null)).IsValid);

    [Fact]
    public void Validator_RejectsEmptyName()
    {
        var result = _validator.Validate(new UpdateProfileRequest("", null));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.Name));
    }

    [Fact]
    public void Validator_RejectsNameExceedingMaxLength()
    {
        var result = _validator.Validate(new UpdateProfileRequest(new string('A', 101), null));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.Name));
    }

    [Theory]
    [InlineData("123")]          // too short
    [InlineData("12345678901")]  // too long
    [InlineData("abcdefghij")]   // letters
    public void Validator_RejectsInvalidPhone(string phone)
    {
        var result = _validator.Validate(new UpdateProfileRequest("Jane", phone));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.Phone));
    }
}

// ── AddTravellerRequest ─────────────────────────────────────────────────────

public class AddTravellerRequestValidatorTests
{
    private readonly AddTravellerRequestValidator _validator = new();

    private static AddTravellerRequest ValidRequest() => new(
        Name:       "John Doe",
        Email:      "john@example.com",
        Phone:      "9876543210",
        DOB:        new DateOnly(1990, 1, 15),
        PassportNo: "A1234567"
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_AcceptsNullOptionalFields()
        => Assert.True(_validator.Validate(new AddTravellerRequest("John", null, null, null, null)).IsValid);

    [Fact]
    public void Validator_RejectsEmptyName()
    {
        var result = _validator.Validate(ValidRequest() with { Name = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddTravellerRequest.Name));
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    public void Validator_RejectsInvalidEmail(string email)
    {
        var result = _validator.Validate(ValidRequest() with { Email = email });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddTravellerRequest.Email));
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("abcdefghij")]
    [InlineData("12345678901")]
    public void Validator_RejectsInvalidPhone(string phone)
    {
        var result = _validator.Validate(ValidRequest() with { Phone = phone });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddTravellerRequest.Phone));
    }

    [Fact]
    public void Validator_RejectsPassportExceedingMaxLength()
    {
        var result = _validator.Validate(ValidRequest() with { PassportNo = new string('X', 21) });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddTravellerRequest.PassportNo));
    }
}

// ── WalletTopUpRequest ──────────────────────────────────────────────────────

public class WalletTopUpRequestValidatorTests
{
    private readonly WalletTopUpRequestValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(500)]
    [InlineData(100000)]
    public void Validator_AcceptsValidAmounts(decimal amount)
        => Assert.True(_validator.Validate(new WalletTopUpRequest(amount)).IsValid);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Validator_RejectsNonPositiveAmount(decimal amount)
    {
        var result = _validator.Validate(new WalletTopUpRequest(amount));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(WalletTopUpRequest.Amount));
    }

    [Fact]
    public void Validator_RejectsAmountExceedingMax()
    {
        var result = _validator.Validate(new WalletTopUpRequest(100001m));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(WalletTopUpRequest.Amount));
    }
}

// ── AddSavedCardRequest ─────────────────────────────────────────────────────

public class AddSavedCardRequestValidatorTests
{
    private readonly AddSavedCardRequestValidator _validator = new();

    private static AddSavedCardRequest ValidRequest() => new(
        CardHolderName: "John Doe",
        CardNumber:     "4111111111111111",
        ExpiryMonth:    12,
        ExpiryYear:     DateTime.UtcNow.Year + 2,
        CardType:       "credit",
        NickName:       "My Card",
        SetAsDefault:   false
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_AcceptsDebitCardType()
        => Assert.True(_validator.Validate(ValidRequest() with { CardType = "debit" }).IsValid);

    [Fact]
    public void Validator_AcceptsNullNickname()
        => Assert.True(_validator.Validate(ValidRequest() with { NickName = null }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyCardHolderName()
    {
        var result = _validator.Validate(ValidRequest() with { CardHolderName = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.CardHolderName));
    }

    [Theory]
    [InlineData("123456789012345")]   // 15 digits
    [InlineData("41111111111111111")] // 17 digits
    [InlineData("411111111111111A")]  // letters
    [InlineData("")]
    public void Validator_RejectsInvalidCardNumber(string number)
    {
        var result = _validator.Validate(ValidRequest() with { CardNumber = number });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.CardNumber));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidExpiryMonth(int month)
    {
        var result = _validator.Validate(ValidRequest() with { ExpiryMonth = month });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.ExpiryMonth));
    }

    [Fact]
    public void Validator_RejectsPastExpiryYear()
    {
        var result = _validator.Validate(ValidRequest() with { ExpiryYear = DateTime.UtcNow.Year - 1 });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.ExpiryYear));
    }

    [Theory]
    [InlineData("prepaid")]
    [InlineData("amex")]
    [InlineData("")]
    public void Validator_RejectsInvalidCardType(string type)
    {
        var result = _validator.Validate(ValidRequest() with { CardType = type });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.CardType));
    }

    [Fact]
    public void Validator_RejectsNickNameExceedingMaxLength()
    {
        var result = _validator.Validate(ValidRequest() with { NickName = new string('X', 51) });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AddSavedCardRequest.NickName));
    }
}
