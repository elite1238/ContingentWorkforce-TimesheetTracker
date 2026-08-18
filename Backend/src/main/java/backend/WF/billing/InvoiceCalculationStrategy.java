package backend.WF.billing;

import backend.WF.contract.Contract;
import backend.WF.invoice.InvoiceLineItem;
import backend.WF.worklog.WorkLog;

import java.time.LocalDate;
import java.util.List;

public interface InvoiceCalculationStrategy {

    /**
     * Calculates line items from approved work logs for the given contract and period.
     * Implementations must not mutate the invoice — they return the computed line items only.
     */
    List<InvoiceLineItem> calculate(Contract contract, List<WorkLog> approvedLogs,
                                    LocalDate periodStart, LocalDate periodEnd);
}
