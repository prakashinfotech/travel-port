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

    Task<List<SavedCardDto>> GetSavedCardsAsync(Guid userId, CancellationToken ct = default);
    Task<SavedCardDto> AddSavedCardAsync(Guid userId, AddSavedCardRequest request, CancellationToken ct = default);
    Task DeleteSavedCardAsync(Guid userId, Guid cardId, CancellationToken ct = default);
    Task<SavedCardDto> SetDefaultCardAsync(Guid userId, Guid cardId, CancellationToken ct = default);
}
