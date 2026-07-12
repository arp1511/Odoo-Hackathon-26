package com.transitops.dto;

import com.transitops.entity.FuelLog;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class FuelLogDto {
    private UUID id;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private UUID tripId;
    private BigDecimal liters;
    private BigDecimal cost;
    private LocalDate logDate;
    private OffsetDateTime createdAt;

    public FuelLogDto(FuelLog log) {
        this.id = log.getId();
        if (log.getVehicle() != null) {
            this.vehicleId = log.getVehicle().getId();
            this.vehicleRegistrationNumber = log.getVehicle().getRegistrationNumber();
        }
        if (log.getTrip() != null) {
            this.tripId = log.getTrip().getId();
        }
        this.liters = log.getLiters();
        this.cost = log.getCost();
        this.logDate = log.getLogDate();
        this.createdAt = log.getCreatedAt();
    }
}
