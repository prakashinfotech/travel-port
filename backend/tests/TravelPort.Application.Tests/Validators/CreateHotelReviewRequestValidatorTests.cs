using TravelPort.Application.DTOs.Hotels;
using TravelPort.Application.Validators.Hotels;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class CreateHotelReviewRequestValidatorTests
{
    private readonly CreateHotelReviewRequestValidator _validator = new();

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        var req = new CreateHotelReviewRequest(4, "Great hotel with excellent service and clean rooms.");
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Validator_AcceptsAllValidRatings(int rating)
    {
        var req = new CreateHotelReviewRequest(rating, "Good stay overall.");
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsMinimumComment()
    {
        var req = new CreateHotelReviewRequest(3, "OK");
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsCommentAtMaxLength()
    {
        var req = new CreateHotelReviewRequest(5, new string('A', 1000));
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — rating ────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Validator_RejectsRatingBelowMinimum(int rating)
    {
        var req = new CreateHotelReviewRequest(rating, "Valid comment.");
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHotelReviewRequest.Rating));
    }

    [Theory]
    [InlineData(6)]
    [InlineData(10)]
    [InlineData(100)]
    public void Validator_RejectsRatingAboveMaximum(int rating)
    {
        var req = new CreateHotelReviewRequest(rating, "Valid comment.");
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHotelReviewRequest.Rating));
    }

    // ── Negative tests — comment ───────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyComment()
    {
        var req = new CreateHotelReviewRequest(4, "");
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHotelReviewRequest.Comment));
    }

    [Fact]
    public void Validator_RejectsCommentExceedingMaxLength()
    {
        var req = new CreateHotelReviewRequest(4, new string('X', 1001));
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateHotelReviewRequest.Comment));
    }

    [Fact]
    public void Validator_RejectsBothInvalidRatingAndEmptyComment()
    {
        var req = new CreateHotelReviewRequest(0, "");
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Equal(2, result.Errors.Count);
    }
}
