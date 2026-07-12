package com.transitops.service;

import com.transitops.dto.ExpenseCreateDto;
import com.transitops.dto.ExpenseDto;
import com.transitops.entity.Expense;
import com.transitops.entity.Vehicle;
import com.transitops.repository.ExpenseRepository;
import com.transitops.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public Page<ExpenseDto> getAllExpenses(Pageable pageable) {
        return expenseRepository.findAll(pageable).map(ExpenseDto::new);
    }

    @Transactional
    public ExpenseDto createExpense(ExpenseCreateDto dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        Expense expense = Expense.builder()
                .vehicle(vehicle)
                .category(dto.getCategory())
                .amount(dto.getAmount())
                .expenseDate(dto.getExpenseDate())
                .description(dto.getDescription())
                .build();

        Expense saved = expenseRepository.save(expense);
        return new ExpenseDto(saved);
    }
}
