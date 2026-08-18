package backend.WF.assignment;

import backend.WF.audit.Auditable;
import backend.WF.assignment.specification.SpecificationChain;
import backend.WF.common.DateRange;
import backend.WF.common.TimeWindow;
import backend.WF.contract.Contract;
import backend.WF.contract.ContractRequirement;
import backend.WF.contract.ContractRequirementRepository;
import backend.WF.employee.Employee;
import backend.WF.employee.EmployeeRepository;
import backend.WF.employee.EmployeeResponse;
import backend.WF.employee.EmployeeService;
import backend.WF.exception.BusinessRuleViolationException;
import backend.WF.exception.EntityNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRequirementRepository requirementRepository;
    private final SpecificationChain specificationChain;
    private final EmployeeService employeeService;
    private final EntityManager entityManager;

    /**
     * THE single method permitted to persist an Assignment.
     * Both manual and algorithmic paths must call this — never bypass it.
     *
     * 1. Acquires pessimistic write lock on the employee row.
     * 2. Re-runs the full Specification chain inside the transaction.
     * 3. Persists assignment and updates requirement.fulfilledCount atomically.
     */
    @Transactional
    @Auditable(action = "CREATE_ASSIGNMENT", entityType = "Assignment")
    public AssignmentResponse createAssignment(AssignmentCreateRequest request) {
        // Step 1: lock employee row — prevents concurrent double-booking
        entityManager.createNativeQuery(
                        "SELECT 1 FROM employees WHERE id = ?1 FOR UPDATE")
                .setParameter(1, request.getEmployeeId())
                .getSingleResult();

        // Step 2: load and lock requirement
        ContractRequirement requirement = requirementRepository.findByIdForUpdate(request.getRequirementId())
                .orElseThrow(() -> new EntityNotFoundException("ContractRequirement", request.getRequirementId()));

        if (requirement.isFullyFulfilled()) {
            throw new BusinessRuleViolationException(
                    "Requirement " + request.getRequirementId() + " is already fully fulfilled ("
                    + requirement.getFulfilledCount() + "/" + requirement.getRequiredEmployeeCount() + ")");
        }

        DateRange dateRange = new DateRange(request.getStartDate(), request.getEndDate());
        TimeWindow timeWindow = new TimeWindow(request.getPlannedStartTime(), request.getPlannedEndTime());
        List<TimeWindow> windows = List.of(timeWindow);

        // Step 3: re-run full spec chain inside transaction (not just UI-preview)
        specificationChain.assertAllSatisfied(
                request.getEmployeeId(), request.getRequirementId(), dateRange, windows);

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee", request.getEmployeeId()));

        // Step 4: persist assignment
        Assignment assignment = Assignment.builder()
                .employee(employee)
                .requirement(requirement)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .plannedStartTime(request.getPlannedStartTime())
                .plannedEndTime(request.getPlannedEndTime())
                .status(AssignmentStatus.ACTIVE)
                .build();
        assignment = assignmentRepository.save(assignment);

        // Step 5: update fulfilledCount in the same transaction
        requirement.setFulfilledCount(requirement.getFulfilledCount() + 1);
        requirementRepository.save(requirement);

        return toResponse(assignment);
    }

    @Transactional
    @Auditable(action = "CANCEL_ASSIGNMENT", entityType = "Assignment")
    public AssignmentResponse cancelAssignment(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment", assignmentId));

        if (assignment.getStatus() == AssignmentStatus.CANCELLED) {
            throw new BusinessRuleViolationException("Assignment is already cancelled");
        }

        assignment.setStatus(AssignmentStatus.CANCELLED);
        assignmentRepository.save(assignment);

        ContractRequirement requirement = assignment.getRequirement();
        if (requirement.getFulfilledCount() > 0) {
            requirement.setFulfilledCount(requirement.getFulfilledCount() - 1);
            requirementRepository.save(requirement);
        }

        return toResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsByRequirement(UUID requirementId) {
        return assignmentRepository.findByRequirementId(requirementId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getMyAssignments(UUID employeeId) {
        return assignmentRepository.findByEmployeeIdAndStatus(employeeId, AssignmentStatus.ACTIVE).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns employees who pass all eligibility specs for the given requirement and date range.
     * Used for the "who can I assign?" manager preview view.
     */
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEligibleEmployees(UUID requirementId,
                                                        LocalDate startDate, LocalDate endDate) {
        ContractRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new EntityNotFoundException("ContractRequirement", requirementId));

        DateRange dateRange = new DateRange(startDate, endDate);

        // Pass empty window list — eligibility preview checks skill, status, and availability pattern
        // (capacity/collision with actual time windows is enforced only at createAssignment time)
        return employeeRepository.findByActiveTrue().stream()
                .filter(emp -> specificationChain.isSatisfied(
                        emp.getId(), requirementId, dateRange, List.of()))
                .map(employeeService::toResponse)
                .toList();
    }

    public AssignmentResponse toResponse(Assignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getFullName())
                .requirementId(a.getRequirement().getId())
                .skillName(a.getRequirement().getSkill().getName())
                .contractId(a.getRequirement().getContract().getId())
                .contractTitle(a.getRequirement().getContract().getTitle())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .plannedStartTime(a.getPlannedStartTime())
                .plannedEndTime(a.getPlannedEndTime())
                .status(a.getStatus())
                .build();
    }
}
