package com.transitops.controller;

import com.transitops.dto.MaintenanceLogCreateDto;
import com.transitops.dto.MaintenanceLogDto;
import com.transitops.entity.MaintenanceStatus;
import com.transitops.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public Page<MaintenanceLogDto> getAllMaintenanceLogs(
            @RequestParam(required = false) MaintenanceStatus status,
            Pageable pageable) {
        return maintenanceService.getAllMaintenanceLogs(status, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public MaintenanceLogDto createMaintenanceLog(
            @Valid @RequestBody MaintenanceLogCreateDto dto,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return maintenanceService.createMaintenanceLog(dto, userEmail);
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public MaintenanceLogDto closeMaintenanceLog(@PathVariable UUID id) {
        return maintenanceService.closeMaintenanceLog(id);
    }
}
