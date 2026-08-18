# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Manager** — vendor company operations staff. Manages the full workforce lifecycle from their desktop: creates contracts with client companies, assigns qualified employees to contract requirements, reviews and approves submitted timesheets, and generates invoices. Operates in a data-dense environment; accuracy and auditability matter more than aesthetics.

**Employee** — contingent worker / contractor. Views their active assignments, submits daily work logs with time segments, and tracks approval status. May use a phone or tablet on-site but predominantly desktop.

## Product Purpose

WorkBridge is the internal operations platform for a vendor company ("XYZ") that supplies skilled contractors to multiple client companies under formal contracts. It manages the full engagement lifecycle: contract intake → employee assignment (manual or algorithmic) → daily time logging → manager approval → invoice generation. Success means zero timesheet disputes, accurate billing, and full audit trail on every engagement.

## Positioning

Single source of truth for contingent workforce operations — from the moment a contract is signed to the moment an invoice is paid. Competitors are spreadsheets and disconnected HR tools; WorkBridge collapses them into one auditable system of record.

## Operating Context

- Managers work at desks managing multiple concurrent contracts and dozens of employees.
- Employees log time daily or weekly, sometimes from client sites.
- All financial values (hours, totals, billing amounts) are computed server-side; the frontend never trusts its own arithmetic.
- Backend: Spring Boot 4.1 / Java 21 REST API at `http://localhost:8080` in dev. JWT auth (Bearer token).
- Frontend: React 19 + Vite + React Router. Token stored in localStorage/memory; role decoded from JWT.

## Capabilities and Constraints

**Manager capabilities:**
- Create/view contracts and contract requirements (skills, headcount, dates)
- View eligible employees per requirement; assign employees manually
- Cancel assignments
- View, approve, or reject submitted work logs
- Generate and approve invoices per contract

**Employee capabilities:**
- View own active assignments
- Submit work logs (date + time segments) for an assignment
- View own work log history and approval status

**Constraints:**
- Role-based access enforced server-side; frontend mirrors it for UX only
- Two roles only in Phase 1: MANAGER and EMPLOYEE
- No self-registration; users are seeded by the system
- Seed credentials: manager / password, employee1 / password

## Brand Commitments

**Name:** WorkBridge
**Voice:** Professional, precise, direct. No marketing language in UI copy. Action labels are verbs ("Approve", "Submit", "Generate Invoice"), not nouns.

## Evidence on Hand

- Full OpenAPI spec available at `http://localhost:8080/swagger-ui.html` once backend runs
- Backend Phase 1: 116 source files, 26/26 tests passing

## Product Principles

1. **Operate mode throughout.** Every screen serves a task — no decoration that doesn't aid scanning or decision-making.
2. **Role clarity at a glance.** Manager and Employee shells are visually distinct; a user always knows which context they're in.
3. **Data density over whitespace.** Managers scan lists of dozens of contracts, assignments, and worklogs. Tables and compact layouts over cards and hero images.
4. **Errors are navigable.** Failed actions show what failed and what to do next — no dead-ends or raw error codes.
5. **Trust the backend.** Optimistic updates only for non-critical reads. All mutations wait for server confirmation before updating UI state.

## Accessibility & Inclusion

WCAG 2.1 AA. Keyboard-navigable tables and forms. Color is never the sole differentiator for status indicators.
