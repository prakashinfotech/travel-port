namespace TravelPort.Application.DTOs.Hotels;

public record HotelSearchRequest(
    string City,
    DateTime CheckIn,
    DateTime CheckOut,
    int Guests = 1,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    int StarRating = 0,
    string SortBy = "price",
    int Page = 1,
    int PageSize = 10
);
