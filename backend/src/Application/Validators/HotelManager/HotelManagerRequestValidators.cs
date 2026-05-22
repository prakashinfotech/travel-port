using FluentValidation;
using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Validators.HotelManager;

public class UpdateHotelDetailsRequestValidator : AbstractValidator<UpdateHotelDetailsRequest>
{
    public UpdateHotelDetailsRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Hotel name cannot exceed 200 characters.")
            .When(x => x.Name is not null);

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City cannot exceed 100 characters.")
            .When(x => x.City is not null);

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address cannot exceed 500 characters.")
            .When(x => x.Address is not null);

        RuleFor(x => x.StarRating)
            .InclusiveBetween(1m, 5m).WithMessage("Star rating must be between 1 and 5.")
            .When(x => x.StarRating.HasValue);

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Amenities)
            .MaximumLength(1000).WithMessage("Amenities cannot exceed 1000 characters.")
            .When(x => x.Amenities is not null);
    }
}

public class UpdateRoomRequestValidator : AbstractValidator<UpdateRoomRequest>
{
    public UpdateRoomRequestValidator()
    {
        RuleFor(x => x.RoomType)
            .MaximumLength(100).WithMessage("Room type cannot exceed 100 characters.")
            .When(x => x.RoomType is not null);

        RuleFor(x => x.PricePerNight)
            .GreaterThan(0).WithMessage("Price per night must be greater than zero.")
            .When(x => x.PricePerNight.HasValue);

        RuleFor(x => x.MaxGuests)
            .InclusiveBetween(1, 20).WithMessage("Max guests must be between 1 and 20.")
            .When(x => x.MaxGuests.HasValue);

        RuleFor(x => x.TotalRooms)
            .GreaterThan(0).WithMessage("Total rooms must be greater than zero.")
            .When(x => x.TotalRooms.HasValue);

        RuleFor(x => x.Amenities)
            .MaximumLength(1000).WithMessage("Amenities cannot exceed 1000 characters.")
            .When(x => x.Amenities is not null);

        RuleFor(x => x.Images)
            .MaximumLength(2000).WithMessage("Images cannot exceed 2000 characters.")
            .When(x => x.Images is not null);
    }
}
