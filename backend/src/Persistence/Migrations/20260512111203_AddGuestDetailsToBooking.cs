using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelPort.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestDetailsToBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GuestEmail",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuestName",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuestPhone",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "GuestEmail", table: "Bookings");
            migrationBuilder.DropColumn(name: "GuestName",  table: "Bookings");
            migrationBuilder.DropColumn(name: "GuestPhone", table: "Bookings");
        }
    }
}
