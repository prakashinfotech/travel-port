using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(p => p.Method).IsRequired().HasConversion<string>().HasMaxLength(30);
        builder.Property(p => p.GatewayOrderId).HasMaxLength(100);
        builder.Property(p => p.GatewayPaymentId).HasMaxLength(100);
        builder.Property(p => p.Amount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(p => p.Status)
               .IsRequired()
               .HasConversion<string>()
               .HasDefaultValue(PaymentStatus.Pending);
        builder.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(p => p.BookingId).HasDatabaseName("IX_Payments_Booking");
    }
}
