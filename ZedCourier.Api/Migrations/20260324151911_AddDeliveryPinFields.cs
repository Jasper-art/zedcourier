using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZedCourier.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryPinFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryPin",
                table: "Parcels",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PinSent",
                table: "Parcels",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PinSentAt",
                table: "Parcels",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceiverEmail",
                table: "Parcels",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderEmail",
                table: "Parcels",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryPin",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "PinSent",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "PinSentAt",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "ReceiverEmail",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "SenderEmail",
                table: "Parcels");
        }
    }
}
