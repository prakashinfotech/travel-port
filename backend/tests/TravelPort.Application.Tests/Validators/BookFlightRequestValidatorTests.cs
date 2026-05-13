using FluentValidation;
using TravelPort.Application.DTOs.Flights;
using TravelPort.Application.Validators.Flights;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class BookFlightRequestValidatorTests
{
    private readonly BookFlightRequestValidator _validator = new();

    [Fact]
    public void Validator_AcceptsSupportedCabinClassAndPassengerRange()
    {
        var request = new BookFlightRequest(Guid.NewGuid(), 2, "Business");

        var result = _validator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("PremiumEconomy")]
    [InlineData("First")]
    public void Validator_RejectsUnsupportedCabinClass(string cabinClass)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), 2, cabinClass);

        var result = _validator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(BookFlightRequest.CabinClass));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    public void Validator_RejectsPassengerCountOutsideSupportedRange(int passengers)
    {
        var request = new BookFlightRequest(Guid.NewGuid(), passengers);

        var result = _validator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(BookFlightRequest.Passengers));
    }
}
