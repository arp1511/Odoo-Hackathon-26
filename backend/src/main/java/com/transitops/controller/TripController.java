package com.transitops.controller;

import com.transitops.dto.TripCompleteDto;
import com.transitops.dto.TripCreateDto;
import com.transitops.dto.TripDto;
import com.transitops.entity.TripStatus;
import com.transitops.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public Page<TripDto> getAllTrips(
            @RequestParam(required = false) TripStatus status,
            @org.springframework.data.web.PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return tripService.getAllTrips(status, pageable);
    }

    @GetMapping("/{id}")
    public TripDto getTripById(@PathVariable UUID id) {
        return tripService.getTripById(id);
    }

    @GetMapping("/active")
    public List<TripDto> getActiveTrips() {
        return tripService.getActiveTrips();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('DISPATCHER', 'FLEET_MANAGER')")
    public TripDto createTrip(@Valid @RequestBody TripCreateDto dto, Authentication authentication) {
        String userEmail = authentication.getName();
        return tripService.createTrip(dto, userEmail);
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyAuthority('DISPATCHER', 'FLEET_MANAGER')")
    public TripDto dispatchTrip(@PathVariable UUID id) {
        return tripService.dispatchTrip(id);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('DISPATCHER', 'FLEET_MANAGER')")
    public TripDto completeTrip(@PathVariable UUID id, @Valid @RequestBody TripCompleteDto dto) {
        return tripService.completeTrip(id, dto);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('DISPATCHER', 'FLEET_MANAGER')")
    public TripDto cancelTrip(@PathVariable UUID id) {
        return tripService.cancelTrip(id);
    }
}
