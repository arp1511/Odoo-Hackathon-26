package com.transitops.controller;

import com.transitops.dto.VehicleAvailableDto;
import com.transitops.dto.VehicleCreateDto;
import com.transitops.dto.VehicleDto;
import com.transitops.dto.VehicleStatusUpdateDto;
import com.transitops.dto.VehicleUpdateDto;
import com.transitops.service.VehicleService;
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
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public Page<VehicleDto> getAllVehicles(Pageable pageable) {
        return vehicleService.getAllVehicles(pageable);
    }

    @GetMapping("/{id}")
    public VehicleDto getVehicleById(@PathVariable UUID id) {
        return vehicleService.getVehicleById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public VehicleDto createVehicle(@Valid @RequestBody VehicleCreateDto dto) {
        return vehicleService.createVehicle(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public VehicleDto updateVehicle(@PathVariable UUID id, @Valid @RequestBody VehicleUpdateDto dto) {
        return vehicleService.updateVehicle(id, dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public VehicleDto updateVehicleStatus(@PathVariable UUID id, @Valid @RequestBody VehicleStatusUpdateDto dto) {
        return vehicleService.updateVehicleStatus(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public void deleteVehicle(@PathVariable UUID id) {
        vehicleService.deleteVehicle(id);
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyAuthority('DISPATCHER', 'FLEET_MANAGER')")
    public List<VehicleAvailableDto> getAvailableVehicles() {
        return vehicleService.getAvailableVehicles();
    }
}
