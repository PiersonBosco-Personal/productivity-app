using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivityApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    calendar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    starts_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ends_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_all_day = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_events", x => x.id);
                    table.CheckConstraint("ck_events_end_after_start", "ends_at_utc > starts_at_utc");
                    table.ForeignKey(
                        name: "fk_events_calendars_calendar_id",
                        column: x => x.calendar_id,
                        principalTable: "calendars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_events_calendar_id_starts_at_utc",
                table: "events",
                columns: new[] { "calendar_id", "starts_at_utc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "events");
        }
    }
}
