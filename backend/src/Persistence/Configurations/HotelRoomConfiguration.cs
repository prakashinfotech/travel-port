using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class HotelRoomConfiguration : IEntityTypeConfiguration<HotelRoom>
{
    public void Configure(EntityTypeBuilder<HotelRoom> builder)
    {
        builder.ToTable("HotelRooms");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(r => r.RoomType).IsRequired().HasMaxLength(50);
        builder.Property(r => r.PricePerNight).HasColumnType("decimal(10,2)").IsRequired();
        builder.Property(r => r.IsActive).HasDefaultValue(true);
    }
}
