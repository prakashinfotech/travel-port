using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelPort.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Buses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BusCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Origin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Destination = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartureTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivalTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    TotalSeats = table.Column<int>(type: "int", nullable: false),
                    AvailableSeats = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BusType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SeatLayoutConfig = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SeatRows = table.Column<int>(type: "int", nullable: false),
                    LadiesSeats = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Amenities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DriverName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DriverPhone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DriverLicense = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StaffDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ScheduleType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DaysOfWeek = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BoardingPoints = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DroppingPoints = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buses_BusCompanies_BusCompanyId",
                        column: x => x.BusCompanyId,
                        principalTable: "BusCompanies",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Buses_BusCompanyId",
                table: "Buses",
                column: "BusCompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Buses");
        }
    }
}
