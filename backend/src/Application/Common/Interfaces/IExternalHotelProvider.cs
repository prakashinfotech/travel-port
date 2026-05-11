using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Application.Common.Interfaces;

public interface IExternalHotelProvider
{
    bool IsConfigured { get; }
    Task<List<HotelDto>> SearchAsync(HotelSearchRequest request, CancellationToken ct = default);
}
