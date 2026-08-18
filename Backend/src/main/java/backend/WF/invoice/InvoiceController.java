package backend.WF.invoice;

import backend.WF.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/api/invoices")
    @PreAuthorize("hasAuthority('GENERATE_INVOICE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(
            @Valid @RequestBody InvoiceGenerateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(invoiceService.generateInvoice(request)));
    }

    @PutMapping("/api/invoices/{id}/approve")
    @PreAuthorize("hasAuthority('APPROVE_INVOICE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> approveInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.approveInvoice(id)));
    }

    @GetMapping("/api/contracts/{contractId}/invoices")
    @PreAuthorize("hasAuthority('VIEW_INVOICES')")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoicesByContract(
            @PathVariable UUID contractId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoicesByContract(contractId)));
    }

    @GetMapping("/api/invoices")
    @PreAuthorize("hasAuthority('VIEW_INVOICES')")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices() {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getAllInvoices()));
    }

    @GetMapping("/api/invoices/{id}")
    @PreAuthorize("hasAuthority('VIEW_INVOICES')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoice(id)));
    }
}
