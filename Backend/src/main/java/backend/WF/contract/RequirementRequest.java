package backend.WF.contract;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@NoArgsConstructor
public class RequirementRequest {

    @NotNull(message = "Skill ID is required")
    private UUID skillId;

    @Min(value = 1, message = "Required employee count must be at least 1")
    private int requiredEmployeeCount;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.01", message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    @NotNull(message = "Expected hours per day is required")
    @DecimalMin(value = "0.5", message = "Expected hours must be at least 0.5")
    private BigDecimal expectedHoursPerDay;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
}
