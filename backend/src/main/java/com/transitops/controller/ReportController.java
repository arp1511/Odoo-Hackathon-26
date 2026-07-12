package com.transitops.controller;

import com.transitops.dto.FleetUtilizationReportDto;
import com.transitops.dto.FuelEfficiencyReportDto;
import com.transitops.dto.OperationalCostReportDto;
import com.transitops.dto.VehicleRoiReportDto;
import com.transitops.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/fuel-efficiency")
    @PreAuthorize("hasAnyAuthority('FINANCIAL_ANALYST', 'FLEET_MANAGER')")
    public List<FuelEfficiencyReportDto> getFuelEfficiencyReport() {
        return reportService.getFuelEfficiencyReport();
    }

    @GetMapping("/fleet-utilization")
    @PreAuthorize("hasAnyAuthority('FINANCIAL_ANALYST', 'FLEET_MANAGER')")
    public FleetUtilizationReportDto getFleetUtilizationReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return reportService.getFleetUtilizationReport(startDate, endDate);
    }

    @GetMapping("/operational-cost")
    @PreAuthorize("hasAuthority('FINANCIAL_ANALYST')")
    public List<OperationalCostReportDto> getOperationalCostReport() {
        return reportService.getOperationalCostReport();
    }

    @GetMapping("/vehicle-roi")
    @PreAuthorize("hasAuthority('FINANCIAL_ANALYST')")
    public List<VehicleRoiReportDto> getVehicleRoiReport() {
        return reportService.getVehicleRoiReport();
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyAuthority('FINANCIAL_ANALYST', 'FLEET_MANAGER')")
    public ResponseEntity<String> exportCsv(@RequestParam String type) {
        String csvContent = reportService.exportToCsv(type);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", type + "-report.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }
}
