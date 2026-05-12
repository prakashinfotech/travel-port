using Microsoft.EntityFrameworkCore;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class CouponRepository : BaseRepository<Coupon>, ICouponRepository
{
    public CouponRepository(TravelPortDbContext context) : base(context) { }

    public async Task<Coupon?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
        => await _dbSet.FirstOrDefaultAsync(
            c => c.Code == code.ToUpper() && c.IsActive,
            cancellationToken);

    public async Task<IReadOnlyList<Coupon>> GetAllCouponsAsync(CancellationToken cancellationToken = default)
        => await _dbSet
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default)
        => await _dbSet.AnyAsync(c => c.Code == code.ToUpper(), cancellationToken);
}
