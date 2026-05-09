using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class SavedTravellerConfiguration : IEntityTypeConfiguration<SavedTraveller>
{
    public void Configure(EntityTypeBuilder<SavedTraveller> builder)
    {
        builder.ToTable("SavedTravellers");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.Name).IsRequired().HasMaxLength(100);
        builder.Property(t => t.Email).HasMaxLength(255);
        builder.Property(t => t.Phone).HasMaxLength(15);
        builder.Property(t => t.PassportNo).HasMaxLength(50);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    }
}
