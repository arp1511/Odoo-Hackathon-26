package com.transitops.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FleetUtilizationReportDto {
    private long activeVehiclesCount;
    private long totalVehiclesCount;
    private BigDecimal utilizationPercent;
}
