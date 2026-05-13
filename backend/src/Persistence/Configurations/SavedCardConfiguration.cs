using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class SavedCardConfiguration : IEntityTypeConfiguration<SavedCard>
{
    public void Configure(EntityTypeBuilder<SavedCard> builder)
    {
        builder.ToTable("SavedCards");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.CardHolderName).HasMaxLength(100).IsRequired();
        builder.Property(c => c.LastFourDigits).HasMaxLength(4).IsRequired();
        builder.Property(c => c.CardType).HasMaxLength(20).IsRequired();
        builder.Property(c => c.NickName).HasMaxLength(50);

        builder.HasIndex(c => c.UserId);

        builder.HasOne(c => c.User)
               .WithMany()
               .HasForeignKey(c => c.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
