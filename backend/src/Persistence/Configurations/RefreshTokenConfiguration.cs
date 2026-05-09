using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWSEQUENTIALID()");
        builder.Property(r => r.Token).IsRequired().HasMaxLength(500);
        builder.Property(r => r.IsRevoked).HasDefaultValue(false);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(r => r.Token).HasDatabaseName("IX_RefreshTokens_Token");
        builder.HasIndex(r => r.UserId).HasDatabaseName("IX_RefreshTokens_User");

        builder.HasOne(r => r.User)
               .WithMany()
               .HasForeignKey(r => r.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
