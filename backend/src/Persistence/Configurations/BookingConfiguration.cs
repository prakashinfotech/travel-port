using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(b => b.BookingRef).IsRequired().HasMaxLength(20);
        builder.Property(b => b.BookingType).IsRequired().HasConversion<string>();
        builder.Property(b => b.TotalAmount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(b => b.DiscountAmount).HasColumnType("decimal(10,2)").HasDefaultValue(0m);
        builder.Property(b => b.FinalAmount).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(b => b.RefundAmount).HasColumnType("decimal(10,2)");
        builder.Property(b => b.Status)
               .IsRequired()
               .HasConversion<string>()
               .HasDefaultValue(BookingStatus.Pending);
        builder.Property(b => b.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(b => b.BookingRef).IsUnique().HasDatabaseName("IX_Bookings_Ref");
        builder.HasIndex(b => b.UserId).HasDatabaseName("IX_Bookings_User");
        builder.HasIndex(b => b.Status).HasDatabaseName("IX_Bookings_Status");

        builder.HasOne(b => b.Payment)
               .WithOne(p => p.Booking)
               .HasForeignKey<Payment>(p => p.BookingId);
    }
}
