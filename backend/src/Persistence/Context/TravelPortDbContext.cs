using Microsoft.EntityFrameworkCore;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Context;

public class TravelPortDbContext : DbContext
{
    public TravelPortDbContext(DbContextOptions<TravelPortDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<HotelRoom> HotelRooms => Set<HotelRoom>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<SavedTraveller> SavedTravellers => Set<SavedTraveller>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<SavedCard> SavedCards => Set<SavedCard>();
    public DbSet<FlightCompany> FlightCompanies => Set<FlightCompany>();
    public DbSet<BusCompany> BusCompanies => Set<BusCompany>();
    public DbSet<CabCompany> CabCompanies => Set<CabCompany>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TravelPortDbContext).Assembly);

        // Global soft-delete filter for all entities with DeletedAt
        modelBuilder.Entity<User>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Flight>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Hotel>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<HotelRoom>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Booking>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Wallet>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<WalletTransaction>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<SavedTraveller>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<Coupon>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<SavedCard>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<FlightCompany>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<BusCompany>().HasQueryFilter(e => e.DeletedAt == null);
        modelBuilder.Entity<CabCompany>().HasQueryFilter(e => e.DeletedAt == null);

        modelBuilder.Entity<Flight>()
            .HasOne(f => f.FlightCompany)
            .WithMany(c => c.Flights)
            .HasForeignKey(f => f.FlightCompanyId)
            .IsRequired(false);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Domain.Common.BaseEntity entity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
