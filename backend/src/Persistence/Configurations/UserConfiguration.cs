using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(u => u.Name).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.Property(u => u.Phone).HasMaxLength(15);
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(u => u.Role)
               .IsRequired()
               .HasConversion<string>()
               .HasDefaultValue(UserRole.User);
        builder.Property(u => u.IsVerified).HasDefaultValue(false);
        builder.Property(u => u.IsActive).HasDefaultValue(true);
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");
        builder.HasIndex(u => u.Phone).HasDatabaseName("IX_Users_Phone");

        builder.HasOne(u => u.Wallet)
               .WithOne(w => w.User)
               .HasForeignKey<Wallet>(w => w.UserId);

        builder.HasMany(u => u.Bookings)
               .WithOne(b => b.User)
               .HasForeignKey(b => b.UserId);

        builder.HasMany(u => u.SavedTravellers)
               .WithOne(s => s.User)
               .HasForeignKey(s => s.UserId);
    }
}
