package com.transitops.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class VehicleAvailableDto {
    private UUID id;
    private String registrationNumber;
    private String name;
    private BigDecimal maxLoadCapacityKg;
}
