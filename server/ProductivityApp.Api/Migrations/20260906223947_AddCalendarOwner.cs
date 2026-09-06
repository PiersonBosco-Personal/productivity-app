using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductivityApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "calendars",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "ix_calendars_user_id",
                table: "calendars",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_calendars_users_user_id",
                table: "calendars",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_calendars_users_user_id",
                table: "calendars");

            migrationBuilder.DropIndex(
                name: "ix_calendars_user_id",
                table: "calendars");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "calendars");
        }
    }
}
