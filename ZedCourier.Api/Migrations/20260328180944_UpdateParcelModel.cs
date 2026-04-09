using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZedCourier.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateParcelModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedDriverId",
                table: "Parcels",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackingLogs_ParcelId",
                table: "TrackingLogs",
                column: "ParcelId");

            migrationBuilder.CreateIndex(
                name: "IX_Parcels_AssignedDriverId",
                table: "Parcels",
                column: "AssignedDriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Parcels_DestinationBranchId",
                table: "Parcels",
                column: "DestinationBranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Parcels_OriginBranchId",
                table: "Parcels",
                column: "OriginBranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Parcels_Branches_DestinationBranchId",
                table: "Parcels",
                column: "DestinationBranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Parcels_Branches_OriginBranchId",
                table: "Parcels",
                column: "OriginBranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Parcels_Users_AssignedDriverId",
                table: "Parcels",
                column: "AssignedDriverId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TrackingLogs_Parcels_ParcelId",
                table: "TrackingLogs",
                column: "ParcelId",
                principalTable: "Parcels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Parcels_Branches_DestinationBranchId",
                table: "Parcels");

            migrationBuilder.DropForeignKey(
                name: "FK_Parcels_Branches_OriginBranchId",
                table: "Parcels");

            migrationBuilder.DropForeignKey(
                name: "FK_Parcels_Users_AssignedDriverId",
                table: "Parcels");

            migrationBuilder.DropForeignKey(
                name: "FK_TrackingLogs_Parcels_ParcelId",
                table: "TrackingLogs");

            migrationBuilder.DropIndex(
                name: "IX_TrackingLogs_ParcelId",
                table: "TrackingLogs");

            migrationBuilder.DropIndex(
                name: "IX_Parcels_AssignedDriverId",
                table: "Parcels");

            migrationBuilder.DropIndex(
                name: "IX_Parcels_DestinationBranchId",
                table: "Parcels");

            migrationBuilder.DropIndex(
                name: "IX_Parcels_OriginBranchId",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "AssignedDriverId",
                table: "Parcels");
        }
    }
}
