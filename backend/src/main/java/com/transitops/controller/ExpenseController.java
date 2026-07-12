package com.transitops.controller;

import com.transitops.dto.ExpenseCreateDto;
import com.transitops.dto.ExpenseDto;
import com.transitops.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FINANCIAL_ANALYST', 'FLEET_MANAGER')")
    public Page<ExpenseDto> getAllExpenses(Pageable pageable) {
        return expenseService.getAllExpenses(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('FLEET_MANAGER')")
    public ExpenseDto createExpense(@Valid @RequestBody ExpenseCreateDto dto) {
        return expenseService.createExpense(dto);
    }
}
