package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class DriverCreateDto {
    private UUID userId;
    @NotBlank
    private String name;
    @NotBlank
    private String licenseNumber;
    @NotBlank
    private String licenseCategory;
    @NotNull
    private LocalDate licenseExpiry;
    @NotBlank
    private String contactNumber;
}
