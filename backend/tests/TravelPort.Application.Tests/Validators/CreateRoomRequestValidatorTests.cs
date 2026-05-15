using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.Validators.HotelManager;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class CreateRoomRequestValidatorTests
{
    private readonly CreateRoomRequestValidator _validator = new();

    private static CreateRoomRequest ValidRequest() => new(
        RoomType: "Deluxe",
        PricePerNight: 3500m,
        MaxGuests: 2,
        TotalRooms: 10,
        Amenities: "[\"WiFi\",\"AC\",\"TV\"]",
        Images: null
    );

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsFullyValidRequest()
    {
        var result = _validator.Validate(ValidRequest());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validator_AcceptsRequestWithNullOptionalFields()
    {
        var req = ValidRequest() with { Amenities = null, Images = null };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("Standard")]
    [InlineData("Deluxe")]
    [InlineData("Suite")]
    [InlineData("Presidential Suite")]
    [InlineData("Single Bed Non-AC")]
    public void Validator_AcceptsValidRoomTypes(string roomType)
    {
        var req = ValidRequest() with { RoomType = roomType };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(10)]
    [InlineData(20)]
    public void Validator_AcceptsValidMaxGuests(int maxGuests)
    {
        var req = ValidRequest() with { MaxGuests = maxGuests };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0.01)]
    [InlineData(500)]
    [InlineData(25000)]
    public void Validator_AcceptsValidPricePerNight(double price)
    {
        var req = ValidRequest() with { PricePerNight = (decimal)price };
        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    // ── Negative tests — required fields ──────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyRoomType()
    {
        var req = ValidRequest() with { RoomType = "" };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.RoomType));
    }

    [Fact]
    public void Validator_RejectsRoomTypeExceedingMaxLength()
    {
        var req = ValidRequest() with { RoomType = new string('X', 101) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.RoomType));
    }

    // ── Negative tests — price ─────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-500)]
    public void Validator_RejectsNonPositivePricePerNight(double price)
    {
        var req = ValidRequest() with { PricePerNight = (decimal)price };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.PricePerNight));
    }

    // ── Negative tests — max guests ───────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(21)]
    [InlineData(100)]
    public void Validator_RejectsMaxGuestsOutOfRange(int maxGuests)
    {
        var req = ValidRequest() with { MaxGuests = maxGuests };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.MaxGuests));
    }

    // ── Negative tests — total rooms ──────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Validator_RejectsNonPositiveTotalRooms(int totalRooms)
    {
        var req = ValidRequest() with { TotalRooms = totalRooms };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.TotalRooms));
    }

    // ── Negative tests — optional field length ────────────────────────────────

    [Fact]
    public void Validator_RejectsAmenitiesExceedingMaxLength()
    {
        var req = ValidRequest() with { Amenities = new string('A', 1001) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.Amenities));
    }

    [Fact]
    public void Validator_RejectsImagesExceedingMaxLength()
    {
        var req = ValidRequest() with { Images = new string('I', 2001) };
        var result = _validator.Validate(req);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateRoomRequest.Images));
    }
}
