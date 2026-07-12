package com.transitops.dto;

import lombok.Data;

@Data
public class DashboardKpis {
    private long activeVehicles;
    private long availableVehicles;
    private long vehiclesInMaintenance;
    private long activeTrips;
    private long pendingTrips;
    private long driversOnDuty;
    private double fleetUtilizationPercent;
}
