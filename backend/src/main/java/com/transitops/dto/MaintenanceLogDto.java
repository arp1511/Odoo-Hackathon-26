package com.transitops.dto;

import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.MaintenanceStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class MaintenanceLogDto {
    private UUID id;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private String description;
    private BigDecimal cost;
    private MaintenanceStatus status;
    private UUID createdByUserId;
    private String createdByUserName;
    private OffsetDateTime createdAt;
    private OffsetDateTime closedAt;

    public MaintenanceLogDto(MaintenanceLog log) {
        this.id = log.getId();
        if (log.getVehicle() != null) {
            this.vehicleId = log.getVehicle().getId();
            this.vehicleRegistrationNumber = log.getVehicle().getRegistrationNumber();
        }
        this.description = log.getDescription();
        this.cost = log.getCost();
        this.status = log.getStatus();
        if (log.getCreatedBy() != null) {
            this.createdByUserId = log.getCreatedBy().getId();
            this.createdByUserName = log.getCreatedBy().getName();
        }
        this.createdAt = log.getCreatedAt();
        this.closedAt = log.getClosedAt();
    }
}
