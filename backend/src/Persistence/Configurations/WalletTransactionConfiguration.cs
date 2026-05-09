using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.Type).IsRequired().HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.Amount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(t => t.Description).HasMaxLength(200);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    }
}
