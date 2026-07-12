package com.transitops.controller;

import com.transitops.dto.DashboardKpis;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/kpis")
    public DashboardKpis getKpis(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String region
    ) {
        DashboardKpis kpis = new DashboardKpis();

        // Base where clause for vehicles
        StringBuilder vehicleWhere = new StringBuilder("WHERE 1=1 ");
        List<Object> vehicleArgs = new ArrayList<>();
        if (type != null) {
            vehicleWhere.append("AND type = ? ");
            vehicleArgs.add(type);
        }
        if (status != null) {
            vehicleWhere.append("AND status = ? ");
            vehicleArgs.add(status);
        }
        if (region != null) {
            vehicleWhere.append("AND region = ? ");
            vehicleArgs.add(region);
        }

        try {
            Long totalVehicles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles " + vehicleWhere, Long.class, vehicleArgs.toArray());
            Long activeVehicles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles " + vehicleWhere + " AND status != 'RETIRED'", Long.class, vehicleArgs.toArray());
            Long availableVehicles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles " + vehicleWhere + " AND status = 'AVAILABLE'", Long.class, vehicleArgs.toArray());
            Long vehiclesInMaintenance = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles " + vehicleWhere + " AND status = 'IN_SHOP'", Long.class, vehicleArgs.toArray());
            Long onTripVehicles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles " + vehicleWhere + " AND status = 'ON_TRIP'", Long.class, vehicleArgs.toArray());
            
            kpis.setActiveVehicles(activeVehicles != null ? activeVehicles : 0);
            kpis.setAvailableVehicles(availableVehicles != null ? availableVehicles : 0);
            kpis.setVehiclesInMaintenance(vehiclesInMaintenance != null ? vehiclesInMaintenance : 0);

            if (totalVehicles != null && totalVehicles > 0 && onTripVehicles != null) {
                kpis.setFleetUtilizationPercent((double) onTripVehicles / totalVehicles * 100);
            } else {
                kpis.setFleetUtilizationPercent(0.0);
            }

            Long activeTrips = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM trips WHERE status = 'DISPATCHED'", Long.class);
            Long pendingTrips = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM trips WHERE status = 'DRAFT'", Long.class);
            kpis.setActiveTrips(activeTrips != null ? activeTrips : 0);
            kpis.setPendingTrips(pendingTrips != null ? pendingTrips : 0);

            Long driversOnDuty = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM drivers WHERE status = 'ON_TRIP'", Long.class);
            kpis.setDriversOnDuty(driversOnDuty != null ? driversOnDuty : 0);

        } catch (Exception e) {
            // Tables might not exist yet if Person B and C haven't run migrations
            // We just return zeros.
        }

        return kpis;
    }
}
