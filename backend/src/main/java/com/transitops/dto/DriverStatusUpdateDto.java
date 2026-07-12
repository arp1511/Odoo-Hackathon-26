package com.transitops.dto;

import com.transitops.entity.DriverStatus;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class DriverStatusUpdateDto {
    @NotNull
    private DriverStatus status;
}
