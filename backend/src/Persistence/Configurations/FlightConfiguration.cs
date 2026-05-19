using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class FlightConfiguration : IEntityTypeConfiguration<Flight>
{
    public void Configure(EntityTypeBuilder<Flight> builder)
    {
        builder.ToTable("Flights");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(f => f.Airline).IsRequired().HasMaxLength(100);
        builder.Property(f => f.FlightNumber).IsRequired().HasMaxLength(20);
        builder.Property(f => f.Source).IsRequired().HasMaxLength(10);
        builder.Property(f => f.Destination).IsRequired().HasMaxLength(10);
        builder.Property(f => f.LayoverAirport).HasMaxLength(10);
        builder.Property(f => f.EconomyPrice).HasColumnType("decimal(10,2)");
        builder.Property(f => f.BusinessPrice).HasColumnType("decimal(10,2)");
        builder.Property(f => f.IsActive).HasDefaultValue(true);
        builder.Property(f => f.Stops).HasDefaultValue(0);
        builder.Property(f => f.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(f => new { f.Source, f.Destination }).HasDatabaseName("IX_Flights_Route");
        builder.HasIndex(f => f.DepartureTime).HasDatabaseName("IX_Flights_Departure");
    }
}
