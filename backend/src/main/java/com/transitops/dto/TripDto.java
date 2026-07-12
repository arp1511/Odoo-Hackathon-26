package com.transitops.dto;

import com.transitops.entity.Trip;
import com.transitops.entity.TripStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class TripDto {
    private UUID id;
    private String source;
    private String destination;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private UUID driverId;
    private String driverName;
    private BigDecimal cargoWeightKg;
    private BigDecimal plannedDistanceKm;
    private BigDecimal actualDistanceKm;
    private BigDecimal fuelConsumedL;
    private BigDecimal revenue;
    private TripStatus status;
    private UUID createdByUserId;
    private String createdByUserName;
    private OffsetDateTime dispatchedAt;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;

    public TripDto(Trip trip) {
        this.id = trip.getId();
        this.source = trip.getSource();
        this.destination = trip.getDestination();
        if (trip.getVehicle() != null) {
            this.vehicleId = trip.getVehicle().getId();
            this.vehicleRegistrationNumber = trip.getVehicle().getRegistrationNumber();
        }
        if (trip.getDriver() != null) {
            this.driverId = trip.getDriver().getId();
            this.driverName = trip.getDriver().getName();
        }
        this.cargoWeightKg = trip.getCargoWeightKg();
        this.plannedDistanceKm = trip.getPlannedDistanceKm();
        this.actualDistanceKm = trip.getActualDistanceKm();
        this.fuelConsumedL = trip.getFuelConsumedL();
        this.revenue = trip.getRevenue();
        this.status = trip.getStatus();
        if (trip.getCreatedBy() != null) {
            this.createdByUserId = trip.getCreatedBy().getId();
            this.createdByUserName = trip.getCreatedBy().getName();
        }
        this.dispatchedAt = trip.getDispatchedAt();
        this.completedAt = trip.getCompletedAt();
        this.createdAt = trip.getCreatedAt();
    }
}
