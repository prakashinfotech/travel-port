using FluentValidation;
using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Validators.HotelManager;

public class CreateRoomRequestValidator : AbstractValidator<CreateRoomRequest>
{
    public CreateRoomRequestValidator()
    {
        RuleFor(x => x.RoomType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PricePerNight).GreaterThan(0m)
            .WithMessage("Price per night must be greater than 0.");
        RuleFor(x => x.MaxGuests).InclusiveBetween(1, 20)
            .WithMessage("Max guests must be between 1 and 20.");
        RuleFor(x => x.TotalRooms).GreaterThan(0)
            .WithMessage("Total rooms must be greater than 0.");
        RuleFor(x => x.Amenities).MaximumLength(1000).When(x => x.Amenities is not null);
        RuleFor(x => x.Images).MaximumLength(2000).When(x => x.Images is not null);
    }
}
