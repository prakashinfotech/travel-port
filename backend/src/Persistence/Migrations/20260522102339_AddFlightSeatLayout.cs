using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelPort.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightSeatLayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LadiesSeats",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeatLayoutConfig",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeatRows",
                table: "Flights",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SeatNumbers",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LadiesSeats",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "SeatLayoutConfig",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "SeatRows",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "SeatNumbers",
                table: "Bookings");
        }
    }
}
