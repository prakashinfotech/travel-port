using TravelPort.Application.DTOs.Users;

namespace TravelPort.Application.Services.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<WalletDto> GetWalletAsync(Guid userId, CancellationToken ct = default);
    Task<List<SavedTravellerDto>> GetSavedTravellersAsync(Guid userId, CancellationToken ct = default);
    Task<SavedTravellerDto> AddSavedTravellerAsync(Guid userId, AddTravellerRequest request, CancellationToken ct = default);
    Task DeleteSavedTravellerAsync(Guid userId, Guid travellerId, CancellationToken ct = default);
}
