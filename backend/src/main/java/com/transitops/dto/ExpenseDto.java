package com.transitops.dto;

import com.transitops.entity.Expense;
import com.transitops.entity.ExpenseCategory;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class ExpenseDto {
    private UUID id;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private ExpenseCategory category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String description;
    private OffsetDateTime createdAt;

    public ExpenseDto(Expense expense) {
        this.id = expense.getId();
        if (expense.getVehicle() != null) {
            this.vehicleId = expense.getVehicle().getId();
            this.vehicleRegistrationNumber = expense.getVehicle().getRegistrationNumber();
        }
        this.category = expense.getCategory();
        this.amount = expense.getAmount();
        this.expenseDate = expense.getExpenseDate();
        this.description = expense.getDescription();
        this.createdAt = expense.getCreatedAt();
    }
}
