using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelPort.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHotelPortal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HotelId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Images",
                table: "Hotels",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Images",
                table: "HotelRooms",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HotelId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Images",
                table: "Hotels");

            migrationBuilder.DropColumn(
                name: "Images",
                table: "HotelRooms");
        }
    }
}
