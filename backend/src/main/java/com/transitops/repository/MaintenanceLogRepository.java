package com.transitops.repository;

import com.transitops.entity.MaintenanceLog;
import com.transitops.entity.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, UUID> {
    Page<MaintenanceLog> findByStatus(MaintenanceStatus status, Pageable pageable);
}
