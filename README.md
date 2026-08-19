# Contingent Workforce Timesheet & Billing System

> **Full-Stack Enterprise Workforce Management Platform**

A production-oriented workforce management platform designed to manage the complete lifecycle of contingent contractors — from employee onboarding and skill-based assignment to timesheet approval, invoice generation, audit logging, and client billing.

Built using **Spring Boot, Java, PostgreSQL, React, and Tailwind CSS**, the system replaces spreadsheet-driven workforce operations with a centralized, secure, auditable platform.

**Tech Stack:** Spring Boot 4.1 · Java 21 · PostgreSQL 15+ · React 19 · Tailwind CSS v4

---

## 🚀 Key Features

### 👥 Workforce Management

* Create and manage contractor profiles
* Assign skills with proficiency levels from 1–5
* Configure employee availability
* Manage assignments and contractor workloads
* Calendar-based assignment visibility

### 📄 Contract Management

* Create client companies
* Create and manage contracts
* Support **HOURLY** and **MILESTONE** billing models
* Define contract requirements including:

  * Required skills
  * Minimum proficiency
  * Billing rate
  * Headcount

### 🎯 Skill-Based Contractor Assignment

* Automatically validate contractor eligibility
* Skill proficiency matching
* Availability and capacity validation
* Date/time collision detection
* Prevent double-booking using database-level pessimistic locking

### ⏱️ Timesheet & Worklog Management

* Submit multiple time segments per day
* Server-side duration calculation
* Detect overlapping work segments
* Submit → Approve/Reject workflow
* Mandatory rejection reason
* Approved worklogs become immutable
* Approved worklogs automatically feed hourly billing

### 💰 Invoice Management

Supports two billing strategies:

**Hourly Billing**

```text
Approved Hours × Contract Hourly Rate = Invoice Amount
```

**Milestone Billing**

```text
Completed Milestone → Finance Approval → Fixed-Amount Invoice
```

* Server-side invoice calculation
* Invoice approval workflow
* Automatic client email notification
* PDF invoice/report generation

### 🔐 Enterprise Security

* JWT-based authentication
* BCrypt password hashing
* Role-Based Access Control
* Fine-grained permissions
* `@PreAuthorize` endpoint/service protection
* Protected frontend routes
* Security enforced at both filter and service layers

### 📝 Audit Logging

Every critical operational and financial action is automatically audited.

The AOP-based audit system records:

* User
* Action
* Entity type
* Entity ID
* Previous state
* New state
* Timestamp

Audit snapshots are stored using PostgreSQL `JSONB`.

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────┐
│                 FRONTEND                    │
│              React 19 SPA                   │
│                                             │
│  React Router · FullCalendar · Axios        │
│  Tailwind CSS · JWT Interceptor             │
└─────────────────────┬───────────────────────┘
                      │ REST API
                      ▼
┌─────────────────────────────────────────────┐
│                  BACKEND                    │
│             Spring Boot 4.1                 │
│                Java 21                      │
│                                             │
│  JWT Authentication                         │
│  Spring Security                            │
│  RBAC / @PreAuthorize                       │
│  Specification Chain                        │
│  Billing Strategy Registry                  │
│  AOP Audit Logging                           │
└─────────────────────┬───────────────────────┘
                      │ JPA
                      ▼
┌─────────────────────────────────────────────┐
│                 DATABASE                    │
│               PostgreSQL 15+                │
│                                             │
│  UUID Primary Keys                          │
│  Flyway Migrations                           │
│  JSONB Audit Snapshots                      │
│  Pessimistic Row Locking                    │
└─────────────────────────────────────────────┘

        ┌──────────────┐      ┌──────────────┐
        │ Resend Email │      │  iText PDF   │
        └──────────────┘      └──────────────┘
```

---

# 🔄 Core Business Workflow

```text
Employee Onboarding
        ↓
Skill & Availability Setup
        ↓
Client & Contract Creation
        ↓
Skill-Matched Assignment
        ↓
Time Logging
        ↓
Manager Approval
        ↓
Invoice Generation
        ↓
Finance Approval
        ↓
Client Email Delivery
```

---

# 👤 User Roles

The platform supports four primary roles with fine-grained permissions.

| Role                | Responsibilities                                               |
| ------------------- | -------------------------------------------------------------- |
| **HR Manager**      | Manage employees, skills, users, roles and permissions         |
| **Manager**         | Manage clients, contracts, assignments and timesheet approvals |
| **Employee**        | View assignments, submit worklogs and manage availability      |
| **Finance Manager** | Generate/approve invoices, manage milestones and export PDFs   |

The RBAC system is **table-driven**, meaning organizational roles and permissions can be changed without modifying application code.

---

# 🧠 Design Patterns

## 1. Strategy Pattern

Used for invoice calculation.

```text
InvoiceCalculationStrategy
        │
        ├── HourlyInvoiceStrategy
        │
        └── MilestoneInvoiceStrategy
```

`BillingStrategyRegistry` dynamically selects the appropriate billing strategy.

### Benefit

Adding a new billing model requires a new strategy implementation instead of modifying the existing invoice service.

---

## 2. Specification Chain Pattern

Used for contractor assignment validation.

```text
ActiveStatusSpecification
          ↓
SkillMatchSpecification
          ↓
CapacitySpecification
          ↓
NoCollisionSpecification
```

Each specification validates one independent business rule.

### Benefit

New assignment rules can be added independently without changing existing validation logic.

---

## 3. AOP Audit Logging

Critical operations are automatically intercepted using Spring AOP.

```text
Service Method
      ↓
@Auditable
      ↓
AuditAspect
      ↓
Capture Before State
      ↓
Execute Business Logic
      ↓
Capture After State
      ↓
Save AuditLog
```

This keeps audit functionality separate from core business logic.

---

## 4. Table-Driven RBAC

Roles and permissions are stored in database tables.

```text
roles
   ↓
role_permissions
   ↓
permissions
```

This allows administrators to create or modify roles without deploying new application code.

---

# 🔒 Concurrency Safety

The assignment workflow uses PostgreSQL pessimistic locking.

```text
Manager A ──┐
            ├── SELECT ... FOR UPDATE
Manager B ──┘
```

The employee row is locked while assignment validation is performed.

The complete specification chain is then re-evaluated inside the transaction.

This prevents two managers from successfully assigning the same contractor at the same time.

---

# ⏱️ Timesheet State Machine

```text
        ┌─────────────┐
        │    DRAFT    │
        └──────┬──────┘
               │ Submit
               ▼
        ┌─────────────┐
        │  SUBMITTED  │
        └──────┬──────┘
          ┌────┴────┐
          │         │
       Approve    Reject
          │         │
          ▼         ▼
    ┌──────────┐  ┌──────────┐
    │ APPROVED │  │ REJECTED │
    └──────────┘  └──────────┘
```

Approved worklogs are immutable and become the source of truth for hourly invoice calculations.

---

# 💳 Billing Architecture

## Hourly Billing

```text
Billing Period
      ↓
Approved Worklogs
      ↓
Assignment
      ↓
Contract Requirement
      ↓
Hourly Rate
      ↓
Hours × Rate
      ↓
Invoice
```

## Milestone Billing

```text
Contract
    ↓
Milestones
    ↓
Milestone Reached
    ↓
Finance Approval
    ↓
Fixed Amount Invoice
```

The invoice service does not contain billing-specific conditional logic. Billing behavior is delegated to the appropriate strategy.

---

# 📝 Audit Architecture

The system provides automatic auditing for critical operations including:

* Assignment creation/cancellation
* Worklog submission
* Worklog approval/rejection
* Invoice generation
* Invoice approval
* Milestone completion
* Milestone approval

Audit records contain before/after JSONB snapshots for traceability.

---

# 🛠️ Technology Stack

### Frontend

* React 19
* Vite 8
* Tailwind CSS v4
* React Router v7
* FullCalendar v6
* Axios

### Backend

* Java 21
* Spring Boot 4.1
* Spring Security 7
* Spring Data JPA
* Spring AOP / AspectJ

### Database

* PostgreSQL 15+
* Flyway
* UUID primary keys
* JSONB
* Pessimistic locking

### Authentication & Security

* JWT
* JJWT
* BCrypt
* Table-driven RBAC
* `@PreAuthorize`

### Integrations

* Resend Email API
* iText 8
* SpringDoc OpenAPI
* Swagger UI

### Build & Deployment

* Maven
* Vite
* Docker-ready
* Environment-based configuration

---

# 📊 Project Statistics

| Component                 |   Count |
| ------------------------- | ------: |
| Database Tables           |  **16** |
| Flyway Migrations         |   **6** |
| Fine-Grained Permissions  | **26+** |
| REST Controllers          |  **14** |
| Billing Strategies        |   **2** |
| Assignment Specifications |   **4** |
| User Roles                |   **4** |
| Design Patterns           |   **4** |

---

# 🛡️ Production-Ready Characteristics

### Concurrency Safe

Database-level pessimistic locking prevents contractor double-booking.

### Server-Side Source of Truth

Worklog durations, invoice amounts, and line items are calculated by the backend rather than trusted from the frontend.

### Immutable Approved Records

Approved worklogs cannot be directly modified. Corrections follow the rejection workflow.

### Complete Audit Trail

Critical business and financial operations are captured automatically through AOP.

### Database Versioning

Flyway migrations provide reproducible and controlled database schema changes.

### Layered Security

JWT authentication protects requests at the filter layer while `@PreAuthorize` enforces permissions at the service layer.

---

# 📁 Suggested Project Structure

```text
contingent-workforce/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── application.yml
│
├── docker/
│
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following are installed:

* Java 21
* Node.js
* npm
* PostgreSQL 15+
* Maven
* Git

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd contingent-workforce
```

---

## 2. Configure PostgreSQL

Create a PostgreSQL database:

```sql
CREATE DATABASE contingent_workforce;
```

Configure the database credentials in:

```text
backend/src/main/resources/application.yml
```

Use environment variables for production credentials.

---

## 3. Run the Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will start on the configured Spring Boot port.

Flyway automatically applies the versioned database migrations.

---

## 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The React development server will start using Vite.

---

# 📚 API Documentation

The application provides an OpenAPI/Swagger interface for exploring and testing the REST API.

```text
/swagger-ui.html
```

The API surface contains **14 REST controllers** covering workforce, contracts, assignments, worklogs, billing, authentication, roles, and related operations.

---

# 🧪 Demo Flow

A recommended demonstration sequence:

```text
1. Login as Manager
        ↓
2. Create Client Company
        ↓
3. Create HOURLY Contract
        ↓
4. Add Java Skill Requirement
        ↓
5. Assign Eligible Contractor
        ↓
6. Submit Worklog as Employee
        ↓
7. Approve Worklog as Manager
        ↓
8. Generate Invoice as Finance
        ↓
9. Approve Invoice
        ↓
10. Automatic Client Email
```

The MILESTONE workflow can then be demonstrated separately:

```text
Create Milestone
      ↓
Mark as REACHED
      ↓
Finance Approval
      ↓
Automatic Invoice
```

---

# 🔐 Demo Credentials

For demonstration purposes, the presentation specifies the following role-based accounts:

```text
manager
hr
finance
employee1

Password:
password
```

> **Important:** These credentials are for demo environments only. Never use default credentials in production.

---

# 🎯 Problem Solved

Traditional contingent workforce operations often depend on spreadsheets, email approvals, manually calculated invoices, and disconnected systems.

This platform centralizes the complete contractor lifecycle:

```text
Employee
   ↓
Skills
   ↓
Availability
   ↓
Assignment
   ↓
Timesheet
   ↓
Approval
   ↓
Billing
   ↓
Invoice
   ↓
Client
```

This provides better operational visibility, stronger financial accuracy, controlled access, and a complete audit trail.

---

# 🏆 Hackathon

**Built for the WorkDay Hackathon**

The project demonstrates an enterprise-oriented approach to workforce management by combining:

* Full-stack application development
* Enterprise security
* Database concurrency control
* Design patterns
* Automated auditing
* Role-based workflows
* Dynamic billing
* API documentation
* PDF generation
* Email automation

---

# 👨‍💻 Contributors

**Team:** Contingent Workforce Platform

Built with **Java · Spring Boot · React · PostgreSQL**

---

# 📄 License

This project was developed as a hackathon/academic project. Add an appropriate open-source license if the repository is intended for public distribution.

