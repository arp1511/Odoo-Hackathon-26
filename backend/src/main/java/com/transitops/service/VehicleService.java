package com.transitops.service;

import com.transitops.dto.VehicleAvailableDto;
import com.transitops.dto.VehicleCreateDto;
import com.transitops.dto.VehicleDto;
import com.transitops.dto.VehicleStatusUpdateDto;
import com.transitops.dto.VehicleUpdateDto;
import com.transitops.entity.Vehicle;
import com.transitops.entity.VehicleStatus;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public Page<VehicleDto> getAllVehicles(Pageable pageable) {
        return vehicleRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        return mapToDto(vehicle);
    }

    @Transactional
    public VehicleDto createVehicle(VehicleCreateDto dto) {
        if (vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
        }

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(dto.getRegistrationNumber())
                .name(dto.getName())
                .type(dto.getType())
                .maxLoadCapacityKg(dto.getMaxLoadCapacityKg())
                .odometerKm(dto.getOdometerKm())
                .acquisitionCost(dto.getAcquisitionCost())
                .region(dto.getRegion())
                .status(VehicleStatus.AVAILABLE)
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToDto(saved);
    }

    @Transactional
    public VehicleDto updateVehicle(UUID id, VehicleUpdateDto dto) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        vehicle.setName(dto.getName());
        vehicle.setType(dto.getType());
        vehicle.setMaxLoadCapacityKg(dto.getMaxLoadCapacityKg());
        vehicle.setOdometerKm(dto.getOdometerKm());
        vehicle.setAcquisitionCost(dto.getAcquisitionCost());
        vehicle.setRegion(dto.getRegion());

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToDto(saved);
    }

    @Transactional
    public VehicleDto updateVehicleStatus(UUID id, VehicleStatusUpdateDto dto) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        
        vehicle.setStatus(dto.getStatus());
        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteVehicle(UUID id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found");
        }
        vehicleRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<VehicleAvailableDto> getAvailableVehicles() {
        return vehicleRepository.findByStatus(VehicleStatus.AVAILABLE).stream()
                .map(v -> {
                    VehicleAvailableDto dto = new VehicleAvailableDto();
                    dto.setId(v.getId());
                    dto.setRegistrationNumber(v.getRegistrationNumber());
                    dto.setName(v.getName());
                    dto.setMaxLoadCapacityKg(v.getMaxLoadCapacityKg());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private VehicleDto mapToDto(Vehicle vehicle) {
        VehicleDto dto = new VehicleDto();
        dto.setId(vehicle.getId());
        dto.setRegistrationNumber(vehicle.getRegistrationNumber());
        dto.setName(vehicle.getName());
        dto.setType(vehicle.getType());
        dto.setMaxLoadCapacityKg(vehicle.getMaxLoadCapacityKg());
        dto.setOdometerKm(vehicle.getOdometerKm());
        dto.setAcquisitionCost(vehicle.getAcquisitionCost());
        dto.setStatus(vehicle.getStatus());
        dto.setRegion(vehicle.getRegion());
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());
        return dto;
    }
}
