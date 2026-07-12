package com.transitops.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DriverAvailableDto {
    private UUID id;
    private String name;
    private String licenseNumber;
    private String licenseCategory;
}
