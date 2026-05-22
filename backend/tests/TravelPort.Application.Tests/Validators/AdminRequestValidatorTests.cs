using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Validators.Admin;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

// ── CreateCouponRequest ─────────────────────────────────────────────────────

public class CreateCouponRequestValidatorTests
{
    private readonly CreateCouponRequestValidator _validator = new();

    private static CreateCouponRequest ValidRequest() => new(
        Code:        "SAVE20",
        Type:        "percentage",
        Value:       20m,
        MinAmount:   500m,
        MaxDiscount: null,
        UsageLimit:  null,
        ExpiresAt:   null
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Theory]
    [InlineData("percentage")]
    [InlineData("flat")]
    [InlineData("PERCENTAGE")]
    [InlineData("FLAT")]
    public void Validator_AcceptsValidTypes(string type)
        => Assert.True(_validator.Validate(ValidRequest() with { Type = type }).IsValid);

    [Fact]
    public void Validator_AcceptsWithOptionalFields()
        => Assert.True(_validator.Validate(ValidRequest() with { MaxDiscount = 200m, UsageLimit = 100 }).IsValid);

    [Fact]
    public void Validator_AcceptsPercentageUpTo100()
        => Assert.True(_validator.Validate(ValidRequest() with { Value = 100m }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyCode()
    {
        var result = _validator.Validate(ValidRequest() with { Code = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.Code));
    }

    [Theory]
    [InlineData("save20")]    // lowercase not allowed
    [InlineData("SAVE 20")]   // space not allowed
    [InlineData("SAVE@20")]   // @ not allowed
    public void Validator_RejectsInvalidCodeFormat(string code)
    {
        var result = _validator.Validate(ValidRequest() with { Code = code });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.Code));
    }

    [Theory]
    [InlineData("discount")]
    [InlineData("promo")]
    [InlineData("")]
    public void Validator_RejectsInvalidType(string type)
    {
        var result = _validator.Validate(ValidRequest() with { Type = type });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.Type));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void Validator_RejectsNonPositiveValue(decimal val)
    {
        var result = _validator.Validate(ValidRequest() with { Value = val });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.Value));
    }

    [Fact]
    public void Validator_RejectsPercentageOver100()
    {
        var result = _validator.Validate(ValidRequest() with { Type = "percentage", Value = 101m });
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_RejectsNegativeMinAmount()
    {
        var result = _validator.Validate(ValidRequest() with { MinAmount = -1m });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.MinAmount));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50)]
    public void Validator_RejectsNonPositiveMaxDiscount(decimal val)
    {
        var result = _validator.Validate(ValidRequest() with { MaxDiscount = val });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.MaxDiscount));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsNonPositiveUsageLimit(int limit)
    {
        var result = _validator.Validate(ValidRequest() with { UsageLimit = limit });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCouponRequest.UsageLimit));
    }
}

// ── UpdateAnnouncementRequest ───────────────────────────────────────────────

public class UpdateAnnouncementRequestValidatorTests
{
    private readonly UpdateAnnouncementRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsAllNullFields()
        => Assert.True(_validator.Validate(new UpdateAnnouncementRequest(null, null, null, null)).IsValid);

    [Fact]
    public void Validator_AcceptsValidTypeWhenProvided()
    {
        var req = new UpdateAnnouncementRequest("Updated message.", "warning", null, true);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsMessageAtMaxLength()
    {
        var req = new UpdateAnnouncementRequest(new string('A', 500), "info", null, null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_RejectsMessageExceedingMaxLength()
    {
        var req = new UpdateAnnouncementRequest(new string('X', 501), "info", null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateAnnouncementRequest.Message));
    }

    [Theory]
    [InlineData("error")]
    [InlineData("critical")]
    [InlineData("alert")]
    public void Validator_RejectsInvalidType(string type)
    {
        var req = new UpdateAnnouncementRequest("Message.", type, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateAnnouncementRequest.Type));
    }
}

// ── AdminUpdateFlightRequest ────────────────────────────────────────────────

public class AdminUpdateFlightRequestValidatorTests
{
    private readonly AdminUpdateFlightRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsAllNullFields()
        => Assert.True(_validator.Validate(new AdminUpdateFlightRequest(null, null, null, null, null, null, null)).IsValid);

    [Fact]
    public void Validator_AcceptsValidPrices()
    {
        var req = new AdminUpdateFlightRequest(5000m, 15000m, 180, 150, null, null, true);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsNonPositiveEconomyPrice(decimal price)
    {
        var req = new AdminUpdateFlightRequest(price, null, null, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminUpdateFlightRequest.EconomyPrice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsNonPositiveBusinessPrice(decimal price)
    {
        var req = new AdminUpdateFlightRequest(null, price, null, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminUpdateFlightRequest.BusinessPrice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void Validator_RejectsNonPositiveTotalSeats(int seats)
    {
        var req = new AdminUpdateFlightRequest(null, null, seats, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminUpdateFlightRequest.TotalSeats));
    }

    [Fact]
    public void Validator_RejectsNegativeAvailableSeats()
    {
        var req = new AdminUpdateFlightRequest(null, null, null, -1, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminUpdateFlightRequest.AvailableSeats));
    }
}

// ── RegisterFlightOperatorRequest ───────────────────────────────────────────

public class RegisterFlightOperatorRequestValidatorTests
{
    private readonly RegisterFlightOperatorRequestValidator _validator = new();

    private static RegisterFlightOperatorRequest ValidRequest() => new(
        CompanyName:     "IndiGo Airlines",
        IataCode:        "6E",
        LogoUrl:         null,
        HeadquartersCity: "Gurugram",
        ContactPhone:    "9876543210",
        ManagerEmail:    "ops@indigo.in",
        ManagerPassword: "Secure@123",
        ManagerName:     "Rahul Sharma"
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Theory]
    [InlineData("6E")]
    [InlineData("AI")]
    [InlineData("SG")]
    public void Validator_AcceptsValidIataCodes(string code)
        => Assert.True(_validator.Validate(ValidRequest() with { IataCode = code }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyCompanyName()
    {
        var result = _validator.Validate(ValidRequest() with { CompanyName = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterFlightOperatorRequest.CompanyName));
    }

    [Theory]
    [InlineData("")]
    [InlineData("X")]      // too short
    [InlineData("ABCD")]   // too long
    [InlineData("6e")]     // lowercase
    public void Validator_RejectsInvalidIataCode(string code)
    {
        var result = _validator.Validate(ValidRequest() with { IataCode = code });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterFlightOperatorRequest.IataCode));
    }

    [Fact]
    public void Validator_RejectsInvalidManagerEmail()
    {
        var result = _validator.Validate(ValidRequest() with { ManagerEmail = "notanemail" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterFlightOperatorRequest.ManagerEmail));
    }

    [Fact]
    public void Validator_RejectsWeakManagerPassword()
    {
        var result = _validator.Validate(ValidRequest() with { ManagerPassword = "weakpass" });
        Assert.False(result.IsValid);
    }
}

// ── RegisterBusOperatorRequest ──────────────────────────────────────────────

public class RegisterBusOperatorRequestValidatorTests
{
    private readonly RegisterBusOperatorRequestValidator _validator = new();

    private static RegisterBusOperatorRequest ValidRequest() => new(
        CompanyName:      "RedBus Express",
        HeadquartersCity: "Bangalore",
        ContactPhone:     "9876543210",
        BusTypes:         "AC,Non-AC",
        ManagerEmail:     "ops@redbus.in",
        ManagerPassword:  "Secure@123",
        ManagerName:      "Priya Nair"
    );

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_AcceptsNullOptionalFields()
        => Assert.True(_validator.Validate(ValidRequest() with { HeadquartersCity = null, ContactPhone = null, BusTypes = null }).IsValid);

    [Fact]
    public void Validator_RejectsEmptyCompanyName()
    {
        var result = _validator.Validate(ValidRequest() with { CompanyName = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterBusOperatorRequest.CompanyName));
    }

    [Fact]
    public void Validator_RejectsInvalidManagerEmail()
    {
        var result = _validator.Validate(ValidRequest() with { ManagerEmail = "bad-email" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterBusOperatorRequest.ManagerEmail));
    }

    [Fact]
    public void Validator_RejectsInvalidContactPhone()
    {
        var result = _validator.Validate(ValidRequest() with { ContactPhone = "12345" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterBusOperatorRequest.ContactPhone));
    }
}

// ── RegisterCabOperatorRequest ──────────────────────────────────────────────

public class RegisterCabOperatorRequestValidatorTests
{
    private readonly RegisterCabOperatorRequestValidator _validator = new();

    private static RegisterCabOperatorRequest ValidRequest() => new(
        CompanyName:         "Ola Cabs",
        City:                "Mumbai",
        ContactPhone:        "9876543210",
        CabTypes:            "Sedan,SUV",
        IsIndividualDriver:  false,
        DriverLicenseNumber: null,
        ManagerEmail:        "fleet@ola.com",
        ManagerPassword:     "Secure@123",
        ManagerName:         "Amit Kumar"
    );

    [Fact]
    public void Validator_AcceptsCompanyWithoutLicense()
        => Assert.True(_validator.Validate(ValidRequest()).IsValid);

    [Fact]
    public void Validator_AcceptsIndividualDriverWithLicense()
    {
        var req = ValidRequest() with { IsIndividualDriver = true, DriverLicenseNumber = "MH01-1234567" };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_RejectsEmptyCompanyName()
    {
        var result = _validator.Validate(ValidRequest() with { CompanyName = "" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterCabOperatorRequest.CompanyName));
    }

    [Fact]
    public void Validator_RejectsIndividualDriverWithoutLicense()
    {
        var req = ValidRequest() with { IsIndividualDriver = true, DriverLicenseNumber = null };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterCabOperatorRequest.DriverLicenseNumber));
    }

    [Fact]
    public void Validator_RejectsInvalidManagerEmail()
    {
        var result = _validator.Validate(ValidRequest() with { ManagerEmail = "notvalid" });
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterCabOperatorRequest.ManagerEmail));
    }
}
