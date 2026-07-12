package com.transitops.repository;

import com.transitops.entity.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, UUID> {
}
