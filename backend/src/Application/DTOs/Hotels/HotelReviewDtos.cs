namespace TravelPort.Application.DTOs.Hotels;

public record HotelReviewDto(
    Guid Id,
    Guid UserId,
    string UserName,
    int Rating,
    string Comment,
    DateTime CreatedAt
);

public record CreateHotelReviewRequest(
    int Rating,
    string Comment
);
