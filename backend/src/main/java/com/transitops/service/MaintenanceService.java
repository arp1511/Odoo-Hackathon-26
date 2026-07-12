package com.transitops.service;

import com.transitops.dto.MaintenanceLogCreateDto;
import com.transitops.dto.MaintenanceLogDto;
import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.MaintenanceStatus;
import com.transitops.entity.User;
import com.transitops.entity.Vehicle;
import com.transitops.entity.VehicleStatus;
import com.transitops.repository.MaintenanceLogRepository;
import com.transitops.repository.UserRepository;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceLogRepository maintenanceLogRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<MaintenanceLogDto> getAllMaintenanceLogs(MaintenanceStatus status, Pageable pageable) {
        if (status != null) {
            return maintenanceLogRepository.findByStatus(status, pageable).map(MaintenanceLogDto::new);
        }
        return maintenanceLogRepository.findAll(pageable).map(MaintenanceLogDto::new);
    }

    @Transactional
    public MaintenanceLogDto createMaintenanceLog(MaintenanceLogCreateDto dto, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        MaintenanceLog log = MaintenanceLog.builder()
                .vehicle(vehicle)
                .description(dto.getDescription())
                .cost(dto.getCost())
                .status(MaintenanceStatus.OPEN)
                .createdBy(creator)
                .build();

        vehicle.setStatus(VehicleStatus.IN_SHOP);
        vehicleRepository.save(vehicle);

        MaintenanceLog saved = maintenanceLogRepository.save(log);
        return new MaintenanceLogDto(saved);
    }

    @Transactional
    public MaintenanceLogDto closeMaintenanceLog(UUID id) {
        MaintenanceLog log = maintenanceLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance log not found"));

        if (log.getStatus() == MaintenanceStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Maintenance log is already closed");
        }

        log.setStatus(MaintenanceStatus.CLOSED);
        log.setClosedAt(OffsetDateTime.now());

        Vehicle vehicle = log.getVehicle();
        if (vehicle.getStatus() != VehicleStatus.RETIRED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        MaintenanceLog saved = maintenanceLogRepository.save(log);
        return new MaintenanceLogDto(saved);
    }
}
