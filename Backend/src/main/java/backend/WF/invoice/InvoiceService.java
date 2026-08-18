package backend.WF.invoice;

import backend.WF.audit.Auditable;
import backend.WF.billing.BillingStrategyRegistry;
import backend.WF.billing.InvoiceCalculationStrategy;
import backend.WF.contract.Contract;
import backend.WF.contract.ContractRepository;
import backend.WF.exception.BusinessRuleViolationException;
import backend.WF.exception.EntityNotFoundException;
import backend.WF.security.CurrentUserService;
import backend.WF.security.User;
import backend.WF.worklog.WorkLog;
import backend.WF.worklog.WorkLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final WorkLogRepository workLogRepository;
    private final BillingStrategyRegistry billingStrategyRegistry;
    private final CurrentUserService currentUserService;

    @Transactional
    @Auditable(action = "GENERATE_INVOICE", entityType = "Invoice")
    public InvoiceResponse generateInvoice(InvoiceGenerateRequest request) {
        Contract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new EntityNotFoundException("Contract", request.getContractId()));

        if (invoiceRepository.findByContractIdAndPeriodStartAndPeriodEnd(
                request.getContractId(), request.getPeriodStart(), request.getPeriodEnd()).isPresent()) {
            throw new BusinessRuleViolationException(
                    "Invoice already exists for this contract and period");
        }

        // Only approved work logs feed into invoicing
        List<WorkLog> approvedLogs = workLogRepository.findApprovedLogsForContract(
                request.getContractId(), request.getPeriodStart(), request.getPeriodEnd());

        InvoiceCalculationStrategy strategy = billingStrategyRegistry.resolve(contract.getBillingType());
        List<InvoiceLineItem> lineItems = strategy.calculate(
                contract, approvedLogs, request.getPeriodStart(), request.getPeriodEnd());

        // Server-side total — never from client
        BigDecimal totalAmount = lineItems.stream()
                .map(InvoiceLineItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        User currentUser = currentUserService.getCurrentUser();

        Invoice invoice = Invoice.builder()
                .contract(contract)
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .totalAmount(totalAmount)
                .status(InvoiceStatus.DRAFT)
                .generatedBy(currentUser.getId())
                .build();
        invoice = invoiceRepository.save(invoice);

        final Invoice savedInvoice = invoice;
        for (InvoiceLineItem item : lineItems) {
            item.setInvoice(savedInvoice);
        }
        savedInvoice.setLineItems(lineItems);
        invoice = invoiceRepository.save(savedInvoice);

        return toResponse(invoice);
    }

    @Transactional
    @Auditable(action = "APPROVE_INVOICE", entityType = "Invoice")
    public InvoiceResponse approveInvoice(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BusinessRuleViolationException(
                    "Only DRAFT invoices can be approved. Current status: " + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setApprovedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByContract(UUID contractId) {
        return invoiceRepository.findByContractId(contractId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID invoiceId) {
        return toResponse(invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId)));
    }

    private InvoiceResponse toResponse(Invoice inv) {
        List<InvoiceResponse.LineItemResponse> items = inv.getLineItems().stream()
                .map(li -> InvoiceResponse.LineItemResponse.builder()
                        .id(li.getId())
                        .description(li.getDescription())
                        .quantity(li.getQuantity())
                        .unitRate(li.getUnitRate())
                        .amount(li.getAmount())
                        .build())
                .toList();

        return InvoiceResponse.builder()
                .id(inv.getId())
                .contractId(inv.getContract().getId())
                .contractTitle(inv.getContract().getTitle())
                .periodStart(inv.getPeriodStart())
                .periodEnd(inv.getPeriodEnd())
                .totalAmount(inv.getTotalAmount())
                .status(inv.getStatus())
                .approvedAt(inv.getApprovedAt())
                .lineItems(items)
                .build();
    }
}
