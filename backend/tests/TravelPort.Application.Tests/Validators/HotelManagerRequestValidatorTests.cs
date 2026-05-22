using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Validators.HotelManager;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

// ── UpdateHotelDetailsRequest ───────────────────────────────────────────────

public class UpdateHotelDetailsRequestValidatorTests
{
    private readonly UpdateHotelDetailsRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsAllNullFields()
        => Assert.True(_validator.Validate(new UpdateHotelDetailsRequest(null, null, null, null, null, null, null, null)).IsValid);

    [Fact]
    public void Validator_AcceptsFullyPopulatedRequest()
    {
        var req = new UpdateHotelDetailsRequest(
            "Grand Hyatt", "Mumbai Bandra", "Mumbai", 5m,
            "Luxury hotel with sea views.", "Pool,Spa,Gym",
            "https://img.example.com/hotel.jpg", null);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsStarRatingAtBoundaries()
    {
        Assert.True(_validator.Validate(new UpdateHotelDetailsRequest(null, null, null, 1m, null, null, null, null)).IsValid);
        Assert.True(_validator.Validate(new UpdateHotelDetailsRequest(null, null, null, 5m, null, null, null, null)).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Validator_RejectsInvalidStarRating(decimal stars)
    {
        var req = new UpdateHotelDetailsRequest(null, null, null, stars, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateHotelDetailsRequest.StarRating));
    }

    [Fact]
    public void Validator_RejectsNameExceedingMaxLength()
    {
        var req = new UpdateHotelDetailsRequest(new string('A', 201), null, null, null, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateHotelDetailsRequest.Name));
    }

    [Fact]
    public void Validator_RejectsCityExceedingMaxLength()
    {
        var req = new UpdateHotelDetailsRequest(null, null, new string('A', 101), null, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateHotelDetailsRequest.City));
    }

    [Fact]
    public void Validator_RejectsDescriptionExceedingMaxLength()
    {
        var req = new UpdateHotelDetailsRequest(null, null, null, null, new string('A', 2001), null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateHotelDetailsRequest.Description));
    }
}

// ── UpdateRoomRequest ───────────────────────────────────────────────────────

public class UpdateRoomRequestValidatorTests
{
    private readonly UpdateRoomRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsAllNullFields()
        => Assert.True(_validator.Validate(new UpdateRoomRequest(null, null, null, null, null, null, null)).IsValid);

    [Fact]
    public void Validator_AcceptsFullyPopulatedRequest()
    {
        var req = new UpdateRoomRequest("Deluxe Suite", 8000m, 4, 10, "AC,TV,WiFi", null, true);
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsNonPositivePricePerNight(decimal price)
    {
        var req = new UpdateRoomRequest(null, price, null, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateRoomRequest.PricePerNight));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(21)]
    public void Validator_RejectsInvalidMaxGuests(int guests)
    {
        var req = new UpdateRoomRequest(null, null, guests, null, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateRoomRequest.MaxGuests));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validator_RejectsNonPositiveTotalRooms(int rooms)
    {
        var req = new UpdateRoomRequest(null, null, null, rooms, null, null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateRoomRequest.TotalRooms));
    }

    [Fact]
    public void Validator_RejectsAmenitiesExceedingMaxLength()
    {
        var req = new UpdateRoomRequest(null, null, null, null, new string('A', 1001), null, null);
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateRoomRequest.Amenities));
    }
}
