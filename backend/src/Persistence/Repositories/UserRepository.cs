using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    public UserRepository(TravelPortDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _dbSet.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        => await _dbSet.AnyAsync(u => u.Email == email, cancellationToken);

    public async Task<(IReadOnlyList<User> Items, int Total)> GetPagedAsync(
        int page, int pageSize, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(u => u.Wallet)
            .Where(u => u.Role == Domain.Enums.UserRole.User || u.Role == Domain.Enums.UserRole.Admin)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(lower) || u.Email.ToLower().Contains(lower));
        }
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<User?> GetHotelManagerAsync(Guid hotelId, CancellationToken cancellationToken = default)
        => await _dbSet.FirstOrDefaultAsync(u => u.HotelId == hotelId && u.Role == Domain.Enums.UserRole.Hotel, cancellationToken);

    public async Task<User?> GetOperatorManagerAsync(Guid companyId, CancellationToken cancellationToken = default)
        => await _dbSet.FirstOrDefaultAsync(u => u.OperatorCompanyId == companyId, cancellationToken);
}
