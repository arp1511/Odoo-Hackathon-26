package com.transitops.service;

import com.opencsv.CSVWriter;
import com.transitops.dto.FleetUtilizationReportDto;
import com.transitops.dto.FuelEfficiencyReportDto;
import com.transitops.dto.OperationalCostReportDto;
import com.transitops.dto.VehicleRoiReportDto;
import com.transitops.entity.FuelLog;
import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.Trip;
import com.transitops.entity.TripStatus;
import com.transitops.entity.Vehicle;
import com.transitops.entity.VehicleStatus;
import com.transitops.repository.FuelLogRepository;
import com.transitops.repository.MaintenanceLogRepository;
import com.transitops.repository.TripRepository;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final FuelLogRepository fuelLogRepository;

    @Transactional(readOnly = true)
    public List<FuelEfficiencyReportDto> getFuelEfficiencyReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Trip> completedTrips = tripRepository.findByStatus(TripStatus.COMPLETED);

        Map<Vehicle, BigDecimal> distanceMap = new HashMap<>();
        Map<Vehicle, BigDecimal> fuelMap = new HashMap<>();

        for (Trip trip : completedTrips) {
            Vehicle vehicle = trip.getVehicle();
            if (vehicle == null) continue;

            BigDecimal distance = trip.getActualDistanceKm() != null ? trip.getActualDistanceKm() : BigDecimal.ZERO;
            BigDecimal fuel = trip.getFuelConsumedL() != null ? trip.getFuelConsumedL() : BigDecimal.ZERO;

            distanceMap.put(vehicle, distanceMap.getOrDefault(vehicle, BigDecimal.ZERO).add(distance));
            fuelMap.put(vehicle, fuelMap.getOrDefault(vehicle, BigDecimal.ZERO).add(fuel));
        }

        List<FuelEfficiencyReportDto> report = new ArrayList<>();
        for (Vehicle vehicle : vehicles) {
            BigDecimal totalDistance = distanceMap.getOrDefault(vehicle, BigDecimal.ZERO);
            BigDecimal totalFuel = fuelMap.getOrDefault(vehicle, BigDecimal.ZERO);
            BigDecimal efficiency = BigDecimal.ZERO;

            if (totalFuel.compareTo(BigDecimal.ZERO) > 0) {
                efficiency = totalDistance.divide(totalFuel, 2, RoundingMode.HALF_UP);
            }

            report.add(new FuelEfficiencyReportDto(
                    vehicle.getId(),
                    vehicle.getRegistrationNumber(),
                    totalDistance,
                    totalFuel,
                    efficiency
            ));
        }

        return report;
    }

    @Transactional(readOnly = true)
    public FleetUtilizationReportDto getFleetUtilizationReport(LocalDate startDate, LocalDate endDate) {
        long totalVehicles = vehicleRepository.count();
        if (totalVehicles == 0) {
            return new FleetUtilizationReportDto(0, 0, BigDecimal.ZERO);
        }

        long activeVehicles;

        if (startDate == null || endDate == null) {
            // Default: currently ON_TRIP vehicles
            activeVehicles = vehicleRepository.countByStatus(VehicleStatus.ON_TRIP);
        } else {
            // Count unique vehicles that have trips active within the date range
            // Trip is active in range if dispatchedAt <= endDate AND (completedAt >= startDate OR completedAt IS NULL)
            OffsetDateTime startDateTime = startDate.atStartOfDay(OffsetDateTime.now().getOffset()).toOffsetDateTime();
            OffsetDateTime endDateTime = endDate.atTime(23, 59, 59).atZone(OffsetDateTime.now().getOffset()).toOffsetDateTime();

            List<Trip> trips = tripRepository.findAll();
            activeVehicles = trips.stream()
                    .filter(t -> t.getStatus() == TripStatus.DISPATCHED || t.getStatus() == TripStatus.COMPLETED)
                    .filter(t -> {
                        OffsetDateTime dispatched = t.getDispatchedAt();
                        OffsetDateTime completed = t.getCompletedAt();
                        if (dispatched == null) return false;
                        
                        boolean dispatchedBeforeEnd = dispatched.isBefore(endDateTime) || dispatched.isEqual(endDateTime);
                        boolean completedAfterStart = completed == null || completed.isAfter(startDateTime) || completed.isEqual(startDateTime);
                        
                        return dispatchedBeforeEnd && completedAfterStart;
                    })
                    .map(t -> t.getVehicle().getId())
                    .distinct()
                    .count();
        }

        BigDecimal utilizationPercent = BigDecimal.valueOf(activeVehicles)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalVehicles), 2, RoundingMode.HALF_UP);

        return new FleetUtilizationReportDto(activeVehicles, totalVehicles, utilizationPercent);
    }

    @Transactional(readOnly = true)
    public List<OperationalCostReportDto> getOperationalCostReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<MaintenanceLog> maintenanceLogs = maintenanceLogRepository.findAll();
        List<FuelLog> fuelLogs = fuelLogRepository.findAll();

        Map<Vehicle, BigDecimal> maintenanceCostMap = new HashMap<>();
        Map<Vehicle, BigDecimal> fuelCostMap = new HashMap<>();

        for (MaintenanceLog log : maintenanceLogs) {
            Vehicle vehicle = log.getVehicle();
            if (vehicle == null) continue;
            BigDecimal cost = log.getCost() != null ? log.getCost() : BigDecimal.ZERO;
            maintenanceCostMap.put(vehicle, maintenanceCostMap.getOrDefault(vehicle, BigDecimal.ZERO).add(cost));
        }

        for (FuelLog log : fuelLogs) {
            Vehicle vehicle = log.getVehicle();
            if (vehicle == null) continue;
            BigDecimal cost = log.getCost() != null ? log.getCost() : BigDecimal.ZERO;
            fuelCostMap.put(vehicle, fuelCostMap.getOrDefault(vehicle, BigDecimal.ZERO).add(cost));
        }

        List<OperationalCostReportDto> report = new ArrayList<>();
        for (Vehicle vehicle : vehicles) {
            BigDecimal maintenanceCost = maintenanceCostMap.getOrDefault(vehicle, BigDecimal.ZERO);
            BigDecimal fuelCost = fuelCostMap.getOrDefault(vehicle, BigDecimal.ZERO);
            BigDecimal totalCost = maintenanceCost.add(fuelCost);

            report.add(new OperationalCostReportDto(
                    vehicle.getId(),
                    vehicle.getRegistrationNumber(),
                    maintenanceCost,
                    fuelCost,
                    totalCost
            ));
        }

        return report;
    }

    @Transactional(readOnly = true)
    public List<VehicleRoiReportDto> getVehicleRoiReport() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Trip> completedTrips = tripRepository.findByStatus(TripStatus.COMPLETED);
        
        List<OperationalCostReportDto> costReport = getOperationalCostReport();
        Map<UUID, OperationalCostReportDto> costMap = new HashMap<>();
        for (OperationalCostReportDto cost : costReport) {
            costMap.put(cost.getVehicleId(), cost);
        }

        Map<Vehicle, BigDecimal> revenueMap = new HashMap<>();
        for (Trip trip : completedTrips) {
            Vehicle vehicle = trip.getVehicle();
            if (vehicle == null) continue;
            BigDecimal rev = trip.getRevenue() != null ? trip.getRevenue() : BigDecimal.ZERO;
            revenueMap.put(vehicle, revenueMap.getOrDefault(vehicle, BigDecimal.ZERO).add(rev));
        }

        List<VehicleRoiReportDto> report = new ArrayList<>();
        for (Vehicle vehicle : vehicles) {
            BigDecimal revenue = revenueMap.getOrDefault(vehicle, BigDecimal.ZERO);
            
            OperationalCostReportDto costDto = costMap.get(vehicle.getId());
            BigDecimal maintenanceCost = costDto != null ? costDto.getMaintenanceCost() : BigDecimal.ZERO;
            BigDecimal fuelCost = costDto != null ? costDto.getFuelCost() : BigDecimal.ZERO;
            
            BigDecimal netProfit = revenue.subtract(maintenanceCost).subtract(fuelCost);
            BigDecimal acquisitionCost = vehicle.getAcquisitionCost();
            BigDecimal roi = BigDecimal.ZERO;

            if (acquisitionCost != null && acquisitionCost.compareTo(BigDecimal.ZERO) > 0) {
                roi = netProfit.divide(acquisitionCost, 4, RoundingMode.HALF_UP);
            }

            report.add(new VehicleRoiReportDto(
                    vehicle.getId(),
                    vehicle.getRegistrationNumber(),
                    acquisitionCost,
                    revenue,
                    maintenanceCost,
                    fuelCost,
                    roi
            ));
        }

        return report;
    }

    public String exportToCsv(String type) {
        StringWriter writer = new StringWriter();
        try (CSVWriter csvWriter = new CSVWriter(writer)) {
            if ("fuel-efficiency".equalsIgnoreCase(type)) {
                csvWriter.writeNext(new String[]{"Vehicle ID", "Registration Number", "Total Distance (km)", "Total Fuel (L)", "Efficiency (km/L)"});
                for (FuelEfficiencyReportDto dto : getFuelEfficiencyReport()) {
                    csvWriter.writeNext(new String[]{
                            dto.getVehicleId().toString(),
                            dto.getRegistrationNumber(),
                            dto.getTotalDistanceKm().toString(),
                            dto.getTotalFuelLiters().toString(),
                            dto.getEfficiency().toString()
                    });
                }
            } else if ("fleet-utilization".equalsIgnoreCase(type)) {
                csvWriter.writeNext(new String[]{"Active Vehicles Count", "Total Vehicles Count", "Utilization (%)"});
                FleetUtilizationReportDto dto = getFleetUtilizationReport(null, null);
                csvWriter.writeNext(new String[]{
                        String.valueOf(dto.getActiveVehiclesCount()),
                        String.valueOf(dto.getTotalVehiclesCount()),
                        dto.getUtilizationPercent().toString()
                });
            } else if ("operational-cost".equalsIgnoreCase(type)) {
                csvWriter.writeNext(new String[]{"Vehicle ID", "Registration Number", "Maintenance Cost ($)", "Fuel Cost ($)", "Total Cost ($)"});
                for (OperationalCostReportDto dto : getOperationalCostReport()) {
                    csvWriter.writeNext(new String[]{
                            dto.getVehicleId().toString(),
                            dto.getRegistrationNumber(),
                            dto.getMaintenanceCost().toString(),
                            dto.getFuelCost().toString(),
                            dto.getTotalCost().toString()
                    });
                }
            } else if ("vehicle-roi".equalsIgnoreCase(type)) {
                csvWriter.writeNext(new String[]{"Vehicle ID", "Registration Number", "Acquisition Cost ($)", "Revenue ($)", "Maintenance Cost ($)", "Fuel Cost ($)", "ROI (Ratio)"});
                for (VehicleRoiReportDto dto : getVehicleRoiReport()) {
                    csvWriter.writeNext(new String[]{
                            dto.getVehicleId().toString(),
                            dto.getRegistrationNumber(),
                            dto.getAcquisitionCost().toString(),
                            dto.getRevenue().toString(),
                            dto.getMaintenanceCost().toString(),
                            dto.getFuelCost().toString(),
                            dto.getRoi().toString()
                    });
                }
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid report type");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error exporting CSV");
        }
        return writer.toString();
    }
}
