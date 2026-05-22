using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.Validators.Admin;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class CreateAnnouncementRequestValidatorTests
{
    private readonly CreateAnnouncementRequestValidator _validator = new();

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("info")]
    [InlineData("warning")]
    [InlineData("success")]
    public void Validator_AcceptsAllValidTypes(string type)
    {
        var req = new CreateAnnouncementRequest("System maintenance at midnight.", type, null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData("INFO")]
    [InlineData("Warning")]
    [InlineData("SUCCESS")]
    public void Validator_AcceptsTypesCaseInsensitive(string type)
    {
        var req = new CreateAnnouncementRequest("Case insensitive check.", type, null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsMessageAtMaxLength()
    {
        var req = new CreateAnnouncementRequest(new string('A', 500), "info", null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsNullExpiresAt()
    {
        var req = new CreateAnnouncementRequest("No expiry announcement.", "success", null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsWithFutureExpiresAt()
    {
        var req = new CreateAnnouncementRequest("Expires soon.", "warning", DateTime.UtcNow.AddDays(7));
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — message ───────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyMessage()
    {
        var req = new CreateAnnouncementRequest("", "info", null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAnnouncementRequest.Message));
    }

    [Fact]
    public void Validator_RejectsWhiteSpaceMessage()
    {
        var req = new CreateAnnouncementRequest("   ", "info", null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAnnouncementRequest.Message));
    }

    [Fact]
    public void Validator_RejectsMessageExceedingMaxLength()
    {
        var req = new CreateAnnouncementRequest(new string('X', 501), "info", null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAnnouncementRequest.Message));
    }

    // ── Negative tests — type ─────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyType()
    {
        var req = new CreateAnnouncementRequest("Valid message.", "", null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAnnouncementRequest.Type));
    }

    [Theory]
    [InlineData("error")]
    [InlineData("critical")]
    [InlineData("notice")]
    [InlineData("alert")]
    [InlineData("unknown")]
    public void Validator_RejectsInvalidType(string type)
    {
        var req = new CreateAnnouncementRequest("Valid message.", type, null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateAnnouncementRequest.Type));
    }

    // ── Negative tests — combined ──────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsBothEmptyMessageAndInvalidType()
    {
        var req = new CreateAnnouncementRequest("", "bad-type", null);
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Equal(2, result.Errors.Count);
    }
}
