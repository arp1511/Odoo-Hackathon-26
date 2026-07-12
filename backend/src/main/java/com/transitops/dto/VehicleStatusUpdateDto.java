package com.transitops.dto;

import com.transitops.entity.VehicleStatus;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class VehicleStatusUpdateDto {
    @NotNull
    private VehicleStatus status;
}
