package com.transitops.repository;

import com.transitops.entity.Driver;
import com.transitops.entity.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {
    
    boolean existsByLicenseNumber(String licenseNumber);
    
    @Query("SELECT d FROM Driver d WHERE d.status = :status AND d.licenseExpiry > CURRENT_DATE")
    List<Driver> findAvailableDrivers(@Param("status") DriverStatus status);
    
    @Query("SELECT d FROM Driver d WHERE d.licenseExpiry BETWEEN CURRENT_DATE AND :endDate ORDER BY d.licenseExpiry ASC")
    List<Driver> findDriversWithExpiringLicenses(@Param("endDate") LocalDate endDate);
}
