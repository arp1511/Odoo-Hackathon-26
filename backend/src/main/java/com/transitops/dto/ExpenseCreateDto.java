package com.transitops.dto;

import com.transitops.entity.ExpenseCategory;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ExpenseCreateDto {
    @NotNull
    private UUID vehicleId;

    @NotNull
    private ExpenseCategory category;

    @NotNull
    @PositiveOrZero
    private BigDecimal amount;

    @NotNull
    private LocalDate expenseDate;

    private String description;
}
