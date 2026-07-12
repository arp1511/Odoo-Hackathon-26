package com.transitops.dto;

import com.transitops.entity.VehicleStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class VehicleDto {
    private UUID id;
    private String registrationNumber;
    private String name;
    private String type;
    private BigDecimal maxLoadCapacityKg;
    private BigDecimal odometerKm;
    private BigDecimal acquisitionCost;
    private VehicleStatus status;
    private String region;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
