using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("Coupons");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.Code).IsRequired().HasMaxLength(30);
        builder.Property(c => c.Type).IsRequired().HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Value).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(c => c.MinAmount).HasColumnType("decimal(10,2)").HasDefaultValue(0m);
        builder.Property(c => c.MaxDiscount).HasColumnType("decimal(10,2)");
        builder.Property(c => c.UsedCount).HasDefaultValue(0);
        builder.Property(c => c.IsActive).HasDefaultValue(true);
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(c => c.Code).IsUnique().HasDatabaseName("IX_Coupons_Code");
    }
}
