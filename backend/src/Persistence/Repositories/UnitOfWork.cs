using TravelPort.Application.Common.Interfaces;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly TravelPortDbContext _context;

    public UnitOfWork(TravelPortDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);

    public void Dispose() => _context.Dispose();
}
