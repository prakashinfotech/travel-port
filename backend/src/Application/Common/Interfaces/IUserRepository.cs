using TravelPort.Domain.Entities;

namespace TravelPort.Application.Common.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<User> Items, int Total)> GetPagedAsync(int page, int pageSize, string? search = null, CancellationToken cancellationToken = default);
}
