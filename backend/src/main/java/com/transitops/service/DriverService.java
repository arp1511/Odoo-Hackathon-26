package com.transitops.service;

import com.transitops.dto.DriverAvailableDto;
import com.transitops.dto.DriverCreateDto;
import com.transitops.dto.DriverDto;
import com.transitops.dto.DriverStatusUpdateDto;
import com.transitops.dto.DriverUpdateDto;
import com.transitops.entity.Driver;
import com.transitops.entity.DriverStatus;
import com.transitops.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public Page<DriverDto> getAllDrivers(Pageable pageable) {
        return driverRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public DriverDto getDriverById(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        return mapToDto(driver);
    }

    @Transactional
    public DriverDto createDriver(DriverCreateDto dto) {
        if (driverRepository.existsByLicenseNumber(dto.getLicenseNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "License number already exists");
        }

        Driver driver = Driver.builder()
                .userId(dto.getUserId())
                .name(dto.getName())
                .licenseNumber(dto.getLicenseNumber())
                .licenseCategory(dto.getLicenseCategory())
                .licenseExpiry(dto.getLicenseExpiry())
                .contactNumber(dto.getContactNumber())
                .status(DriverStatus.AVAILABLE)
                .build();

        Driver saved = driverRepository.save(driver);
        return mapToDto(saved);
    }

    @Transactional
    public DriverDto updateDriver(UUID id, DriverUpdateDto dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        driver.setUserId(dto.getUserId());
        driver.setName(dto.getName());
        driver.setLicenseNumber(dto.getLicenseNumber());
        driver.setLicenseCategory(dto.getLicenseCategory());
        driver.setLicenseExpiry(dto.getLicenseExpiry());
        driver.setContactNumber(dto.getContactNumber());

        Driver saved = driverRepository.save(driver);
        return mapToDto(saved);
    }

    @Transactional
    public DriverDto updateDriverStatus(UUID id, DriverStatusUpdateDto dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        
        driver.setStatus(dto.getStatus());
        Driver saved = driverRepository.save(driver);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DriverAvailableDto> getAvailableDrivers() {
        return driverRepository.findAvailableDrivers(DriverStatus.AVAILABLE).stream()
                .map(d -> {
                    DriverAvailableDto dto = new DriverAvailableDto();
                    dto.setId(d.getId());
                    dto.setName(d.getName());
                    dto.setLicenseNumber(d.getLicenseNumber());
                    dto.setLicenseCategory(d.getLicenseCategory());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DriverDto> getExpiringLicenses(int days) {
        LocalDate endDate = LocalDate.now().plusDays(days);
        return driverRepository.findDriversWithExpiringLicenses(endDate).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private DriverDto mapToDto(Driver driver) {
        DriverDto dto = new DriverDto();
        dto.setId(driver.getId());
        dto.setUserId(driver.getUserId());
        dto.setName(driver.getName());
        dto.setLicenseNumber(driver.getLicenseNumber());
        dto.setLicenseCategory(driver.getLicenseCategory());
        dto.setLicenseExpiry(driver.getLicenseExpiry());
        dto.setContactNumber(driver.getContactNumber());
        dto.setSafetyScore(driver.getSafetyScore());
        dto.setStatus(driver.getStatus());
        dto.setCreatedAt(driver.getCreatedAt());
        return dto;
    }
}
