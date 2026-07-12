package com.transitops.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OperationalCostReportDto {
    private UUID vehicleId;
    private String registrationNumber;
    private BigDecimal maintenanceCost;
    private BigDecimal fuelCost;
    private BigDecimal totalCost;
}
