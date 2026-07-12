package com.transitops.controller;

import com.transitops.dto.DriverAvailableDto;
import com.transitops.dto.DriverCreateDto;
import com.transitops.dto.DriverDto;
import com.transitops.dto.DriverStatusUpdateDto;
import com.transitops.dto.DriverUpdateDto;
import com.transitops.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    public Page<DriverDto> getAllDrivers(Pageable pageable) {
        return driverService.getAllDrivers(pageable);
    }

    @GetMapping("/{id}")
    public DriverDto getDriverById(@PathVariable UUID id) {
        return driverService.getDriverById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public DriverDto createDriver(@Valid @RequestBody DriverCreateDto dto) {
        return driverService.createDriver(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('FLEET_MANAGER', 'SAFETY_OFFICER')")
    public DriverDto updateDriver(@PathVariable UUID id, @Valid @RequestBody DriverUpdateDto dto) {
        return driverService.updateDriver(id, dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('SAFETY_OFFICER')")
    public DriverDto updateDriverStatus(@PathVariable UUID id, @Valid @RequestBody DriverStatusUpdateDto dto) {
        return driverService.updateDriverStatus(id, dto);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAuthority('DISPATCHER')")
    public List<DriverAvailableDto> getAvailableDrivers() {
        return driverService.getAvailableDrivers();
    }

    @GetMapping("/expiring-licenses")
    @PreAuthorize("hasAuthority('SAFETY_OFFICER')")
    public List<DriverDto> getExpiringLicenses(@RequestParam(defaultValue = "30") int days) {
        return driverService.getExpiringLicenses(days);
    }
}
