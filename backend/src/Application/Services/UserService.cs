using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Users;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;

namespace TravelPort.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IRepository<Wallet> _wallets;
    private readonly IRepository<SavedTraveller> _travellers;
    private readonly IUnitOfWork _uow;

    public UserService(
        IUserRepository users,
        IRepository<Wallet> wallets,
        IRepository<SavedTraveller> travellers,
        IUnitOfWork uow)
    {
        _users = users;
        _wallets = wallets;
        _travellers = travellers;
        _uow = uow;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct) ?? throw new NotFoundException("User", userId);
        return ToProfileDto(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct) ?? throw new NotFoundException("User", userId);
        user.Name = request.Name;
        user.Phone = request.Phone;
        await _users.UpdateAsync(user, ct);
        await _uow.SaveChangesAsync(ct);
        return ToProfileDto(user);
    }

    public async Task<WalletDto> GetWalletAsync(Guid userId, CancellationToken ct = default)
    {
        var wallets = await _wallets.FindAsync(w => w.UserId == userId, ct);
        var wallet = wallets.FirstOrDefault() ?? throw new NotFoundException("Wallet not found for user.");

        var transactions = wallet.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new WalletTransactionDto(t.Type.ToString(), t.Amount, t.Description, t.CreatedAt))
            .ToList();

        return new WalletDto(wallet.Id, wallet.Balance, transactions);
    }

    public async Task<List<SavedTravellerDto>> GetSavedTravellersAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _travellers.FindAsync(t => t.UserId == userId, ct);
        return list.Select(ToTravellerDto).ToList();
    }

    public async Task<SavedTravellerDto> AddSavedTravellerAsync(Guid userId, AddTravellerRequest request, CancellationToken ct = default)
    {
        var traveller = new SavedTraveller
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            DOB = request.DOB,
            PassportNo = request.PassportNo
        };
        await _travellers.AddAsync(traveller, ct);
        await _uow.SaveChangesAsync(ct);
        return ToTravellerDto(traveller);
    }

    public async Task DeleteSavedTravellerAsync(Guid userId, Guid travellerId, CancellationToken ct = default)
    {
        var traveller = await _travellers.GetByIdAsync(travellerId, ct)
            ?? throw new NotFoundException("Traveller", travellerId);

        if (traveller.UserId != userId)
            throw new UnauthorizedException("Access denied.");

        await _travellers.DeleteAsync(traveller, ct);
        await _uow.SaveChangesAsync(ct);
    }

    private static UserProfileDto ToProfileDto(User u) =>
        new(u.Id, u.Name, u.Email, u.Phone, u.Role.ToString(), u.IsVerified, u.CreatedAt);

    private static SavedTravellerDto ToTravellerDto(SavedTraveller t) =>
        new(t.Id, t.Name, t.Email, t.Phone, t.DOB);
}
