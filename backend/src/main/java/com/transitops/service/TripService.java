package com.transitops.service;

import com.transitops.dto.TripCompleteDto;
import com.transitops.dto.TripCreateDto;
import com.transitops.dto.TripDto;
import com.transitops.entity.Driver;
import com.transitops.entity.DriverStatus;
import com.transitops.entity.Trip;
import com.transitops.entity.TripStatus;
import com.transitops.entity.User;
import com.transitops.entity.Vehicle;
import com.transitops.entity.VehicleStatus;
import com.transitops.repository.DriverRepository;
import com.transitops.repository.TripRepository;
import com.transitops.repository.UserRepository;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TripDto> getAllTrips(TripStatus status, Pageable pageable) {
        if (status != null) {
            return tripRepository.findByStatus(status, pageable).map(TripDto::new);
        }
        return tripRepository.findAll(pageable).map(TripDto::new);
    }

    @Transactional(readOnly = true)
    public TripDto getTripById(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        return new TripDto(trip);
    }

    @Transactional(readOnly = true)
    public List<TripDto> getActiveTrips() {
        return tripRepository.findByStatus(TripStatus.DISPATCHED).stream()
                .map(TripDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripDto createTrip(TripCreateDto dto, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Driver driver = driverRepository.findById(dto.getDriverId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        Trip trip = Trip.builder()
                .source(dto.getSource())
                .destination(dto.getDestination())
                .vehicle(vehicle)
                .driver(driver)
                .cargoWeightKg(dto.getCargoWeightKg())
                .plannedDistanceKm(dto.getPlannedDistanceKm())
                .revenue(dto.getRevenue() != null ? dto.getRevenue() : BigDecimal.ZERO)
                .status(TripStatus.DRAFT)
                .createdBy(creator)
                .build();

        Trip saved = tripRepository.save(trip);
        return new TripDto(saved);
    }

    @Transactional
    public TripDto dispatchTrip(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only DRAFT trips can be dispatched");
        }

        // 1. Re-fetch vehicle and driver fresh from DB by ID
        Vehicle vehicle = vehicleRepository.findById(trip.getVehicle().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Driver driver = driverRepository.findById(trip.getDriver().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        // 2. check vehicle status
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vehicle no longer available");
        }

        // 3. check driver status
        if (driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver no longer available");
        }

        // 4. check driver license expiry
        if (driver.getLicenseExpiry().isBefore(LocalDate.now()) || driver.getLicenseExpiry().isEqual(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver's license has expired");
        }

        // 5. check cargo weight
        if (trip.getCargoWeightKg().compareTo(vehicle.getMaxLoadCapacityKg()) > 0) {
            BigDecimal excess = trip.getCargoWeightKg().subtract(vehicle.getMaxLoadCapacityKg());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cargo exceeds vehicle capacity by " + excess + "kg");
        }

        // 6. If all pass, update statuses
        vehicle.setStatus(VehicleStatus.ON_TRIP);
        driver.setStatus(DriverStatus.ON_TRIP);
        trip.setStatus(TripStatus.DISPATCHED);
        trip.setDispatchedAt(OffsetDateTime.now());

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        Trip saved = tripRepository.save(trip);

        return new TripDto(saved);
    }

    @Transactional
    public TripDto completeTrip(UUID id, TripCompleteDto dto) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        if (trip.getStatus() != TripStatus.DISPATCHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only DISPATCHED trips can be completed");
        }

        Vehicle vehicle = vehicleRepository.findById(trip.getVehicle().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Driver driver = driverRepository.findById(trip.getDriver().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        vehicle.setStatus(VehicleStatus.AVAILABLE);
        driver.setStatus(DriverStatus.AVAILABLE);

        trip.setStatus(TripStatus.COMPLETED);
        trip.setCompletedAt(OffsetDateTime.now());
        trip.setActualDistanceKm(dto.getActualDistanceKm());
        trip.setFuelConsumedL(dto.getFuelConsumedL());

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        Trip saved = tripRepository.save(trip);

        return new TripDto(saved);
    }

    @Transactional
    public TripDto cancelTrip(UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        if (trip.getStatus() != TripStatus.DISPATCHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only DISPATCHED trips can be cancelled");
        }

        Vehicle vehicle = vehicleRepository.findById(trip.getVehicle().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Driver driver = driverRepository.findById(trip.getDriver().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        vehicle.setStatus(VehicleStatus.AVAILABLE);
        driver.setStatus(DriverStatus.AVAILABLE);
        trip.setStatus(TripStatus.CANCELLED);

        vehicleRepository.save(vehicle);
        driverRepository.save(driver);
        Trip saved = tripRepository.save(trip);

        return new TripDto(saved);
    }
}
