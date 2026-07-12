package com.transitops.controller;

import com.transitops.dto.FuelLogCreateDto;
import com.transitops.dto.FuelLogDto;
import com.transitops.service.FuelLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fuel-logs")
@RequiredArgsConstructor
public class FuelLogController {

    private final FuelLogService fuelLogService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FLEET_MANAGER', 'FINANCIAL_ANALYST')")
    public Page<FuelLogDto> getAllFuelLogs(Pageable pageable) {
        return fuelLogService.getAllFuelLogs(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('FLEET_MANAGER', 'DISPATCHER')")
    public FuelLogDto createFuelLog(@Valid @RequestBody FuelLogCreateDto dto) {
        return fuelLogService.createFuelLog(dto);
    }
}
