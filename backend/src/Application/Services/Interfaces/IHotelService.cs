using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Application.Services.Interfaces;

public interface IHotelService
{
    Task<(List<HotelDto> Items, int Total)> SearchAsync(HotelSearchRequest request, CancellationToken ct = default);
    Task<HotelDto> GetByIdAsync(Guid hotelId, CancellationToken ct = default);
    Task<BookingCreatedResponse> BookAsync(Guid userId, BookHotelRequest request, CancellationToken ct = default);
    Task<HotelReviewDto> CreateReviewAsync(Guid userId, Guid hotelId, CreateHotelReviewRequest request, CancellationToken ct = default);
}
