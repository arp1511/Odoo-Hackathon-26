package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

@Data
public class VehicleCreateDto {
    @NotBlank
    private String registrationNumber;
    @NotBlank
    private String name;
    @NotBlank
    private String type;
    @NotNull
    @Positive
    private BigDecimal maxLoadCapacityKg;
    @NotNull
    @PositiveOrZero
    private BigDecimal odometerKm;
    @NotNull
    @PositiveOrZero
    private BigDecimal acquisitionCost;
    private String region;
}
