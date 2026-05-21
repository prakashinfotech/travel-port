using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelPort.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomIdToBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RoomId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "Bookings");
        }
    }
}
