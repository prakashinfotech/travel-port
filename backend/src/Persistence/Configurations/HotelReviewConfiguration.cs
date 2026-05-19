using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TravelPort.Domain.Entities;

namespace TravelPort.Persistence.Configurations;

public class HotelReviewConfiguration : IEntityTypeConfiguration<HotelReview>
{
    public void Configure(EntityTypeBuilder<HotelReview> builder)
    {
        builder.ToTable("HotelReviews");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(r => r.Rating).IsRequired();
        builder.Property(r => r.Comment).IsRequired().HasMaxLength(1000);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(r => r.HotelId).HasDatabaseName("IX_HotelReviews_HotelId");
        builder.HasIndex(r => new { r.HotelId, r.UserId })
            .IsUnique()
            .HasFilter("[DeletedAt] IS NULL")
            .HasDatabaseName("IX_HotelReviews_HotelId_UserId");

        builder.HasOne(r => r.Hotel)
            .WithMany(h => h.Reviews)
            .HasForeignKey(r => r.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
