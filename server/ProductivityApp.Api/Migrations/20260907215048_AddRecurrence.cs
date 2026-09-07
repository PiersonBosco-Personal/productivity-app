using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivityApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurrence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "recurrence_freq",
                table: "events",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "recurrence_interval",
                table: "events",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateTime>(
                name: "recurrence_until_utc",
                table: "events",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_events_recurrence_interval_positive",
                table: "events",
                sql: "recurrence_interval >= 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_events_recurrence_interval_positive",
                table: "events");

            migrationBuilder.DropColumn(
                name: "recurrence_freq",
                table: "events");

            migrationBuilder.DropColumn(
                name: "recurrence_interval",
                table: "events");

            migrationBuilder.DropColumn(
                name: "recurrence_until_utc",
                table: "events");
        }
    }
}
