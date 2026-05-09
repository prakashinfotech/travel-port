using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class HotelConfiguration : IEntityTypeConfiguration<Hotel>
{
    public void Configure(EntityTypeBuilder<Hotel> builder)
    {
        builder.ToTable("Hotels");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(h => h.Name).IsRequired().HasMaxLength(200);
        builder.Property(h => h.City).IsRequired().HasMaxLength(100);
        builder.Property(h => h.Address).HasMaxLength(500);
        builder.Property(h => h.StarRating).HasColumnType("decimal(2,1)").IsRequired();
        builder.Property(h => h.Latitude).HasColumnType("decimal(9,6)");
        builder.Property(h => h.Longitude).HasColumnType("decimal(9,6)");
        builder.Property(h => h.IsActive).HasDefaultValue(true);
        builder.Property(h => h.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(h => h.City).HasDatabaseName("IX_Hotels_City");
        builder.HasIndex(h => h.StarRating).HasDatabaseName("IX_Hotels_Rating");

        builder.HasMany(h => h.Rooms)
               .WithOne(r => r.Hotel)
               .HasForeignKey(r => r.HotelId);
    }
}
