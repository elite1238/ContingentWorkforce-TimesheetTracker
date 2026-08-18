package backend.WF.billing;

import backend.WF.contract.BillingType;
import backend.WF.exception.BusinessRuleViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BillingStrategyRegistry {

    private final HourlyInvoiceStrategy hourlyInvoiceStrategy;

    public InvoiceCalculationStrategy resolve(BillingType type) {
        return switch (type) {
            case HOURLY -> hourlyInvoiceStrategy;
            default -> throw new BusinessRuleViolationException(
                    "Unsupported billing type: " + type + ". No strategy registered.");
        };
    }
}
