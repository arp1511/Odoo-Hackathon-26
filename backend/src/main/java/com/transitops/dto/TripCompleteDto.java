package com.transitops.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

@Data
public class TripCompleteDto {
    @NotNull
    @Positive
    private BigDecimal actualDistanceKm;

    @NotNull
    @Positive
    private BigDecimal fuelConsumedL;
}
