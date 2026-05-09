using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(w => w.Balance).HasColumnType("decimal(10,2)").HasDefaultValue(0m);
        builder.Property(w => w.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(w => w.UserId).IsUnique();

        builder.HasMany(w => w.Transactions)
               .WithOne(t => t.Wallet)
               .HasForeignKey(t => t.WalletId);
    }
}
