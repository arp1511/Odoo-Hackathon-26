package com.transitops.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuelEfficiencyReportDto {
    private UUID vehicleId;
    private String registrationNumber;
    private BigDecimal totalDistanceKm;
    private BigDecimal totalFuelLiters;
    private BigDecimal efficiency;
}
