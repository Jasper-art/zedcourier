using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZedCourier.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSenderReceiverNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReceiverName",
                table: "Parcels",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "Parcels",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiverName",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "Parcels");
        }
    }
}
