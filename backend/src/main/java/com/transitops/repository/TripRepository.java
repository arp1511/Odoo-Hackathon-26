package com.transitops.repository;

import com.transitops.entity.Trip;
import com.transitops.entity.TripStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {
    Page<Trip> findByStatus(TripStatus status, Pageable pageable);
    List<Trip> findByStatus(TripStatus status);
}
