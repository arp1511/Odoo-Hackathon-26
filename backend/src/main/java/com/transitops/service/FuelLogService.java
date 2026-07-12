package com.transitops.service;

import com.transitops.dto.FuelLogCreateDto;
import com.transitops.dto.FuelLogDto;
import com.transitops.entity.FuelLog;
import com.transitops.entity.Trip;
import com.transitops.entity.Vehicle;
import com.transitops.repository.FuelLogRepository;
import com.transitops.repository.TripRepository;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FuelLogService {

    private final FuelLogRepository fuelLogRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    @Transactional(readOnly = true)
    public Page<FuelLogDto> getAllFuelLogs(Pageable pageable) {
        return fuelLogRepository.findAll(pageable).map(FuelLogDto::new);
    }

    @Transactional
    public FuelLogDto createFuelLog(FuelLogCreateDto dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Trip trip = null;
        if (dto.getTripId() != null) {
            trip = tripRepository.findById(dto.getTripId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        }

        FuelLog log = FuelLog.builder()
                .vehicle(vehicle)
                .trip(trip)
                .liters(dto.getLiters())
                .cost(dto.getCost())
                .logDate(dto.getLogDate())
                .build();

        FuelLog saved = fuelLogRepository.save(log);
        return new FuelLogDto(saved);
    }
}
