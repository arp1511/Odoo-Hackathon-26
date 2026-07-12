package com.transitops.dto;

import com.transitops.entity.DriverStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class DriverDto {
    private UUID id;
    private UUID userId;
    private String name;
    private String licenseNumber;
    private String licenseCategory;
    private LocalDate licenseExpiry;
    private String contactNumber;
    private BigDecimal safetyScore;
    private DriverStatus status;
    private OffsetDateTime createdAt;
}
