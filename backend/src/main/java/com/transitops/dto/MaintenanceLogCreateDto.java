package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class MaintenanceLogCreateDto {
    @NotNull
    private UUID vehicleId;

    @NotBlank
    private String description;

    @NotNull
    @PositiveOrZero
    private BigDecimal cost;
}
