package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class FuelLogCreateDto {
    @NotNull
    private UUID vehicleId;

    private UUID tripId;

    @NotNull
    @Positive
    private BigDecimal liters;

    @NotNull
    @PositiveOrZero
    private BigDecimal cost;

    @NotNull
    private LocalDate logDate;
}
