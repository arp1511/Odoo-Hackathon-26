package com.transitops.repository;

import com.transitops.entity.Vehicle;
import com.transitops.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    
    boolean existsByRegistrationNumber(String registrationNumber);
    
    List<Vehicle> findByStatus(VehicleStatus status);

    long countByStatus(VehicleStatus status);
}
