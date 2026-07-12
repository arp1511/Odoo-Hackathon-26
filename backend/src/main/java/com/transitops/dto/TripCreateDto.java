package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TripCreateDto {
    @NotBlank
    private String source;

    @NotBlank
    private String destination;

    @NotNull
    private UUID vehicleId;

    @NotNull
    private UUID driverId;

    @NotNull
    @Positive
    private BigDecimal cargoWeightKg;

    @NotNull
    @Positive
    private BigDecimal plannedDistanceKm;

    @PositiveOrZero
    private BigDecimal revenue;
}
