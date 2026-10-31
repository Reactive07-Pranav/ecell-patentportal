# MUJ Patent Application Portal

An institutional intellectual property disclosure and patent management system developed for Manipal University Jaipur (MUJ).

The portal replaces manual email attachments to the university patent coordinator and review cell, providing a structured, secure, and transparent workflow for students, faculty inventors, and university administration.

> **Institutional Notice**: This portal manages internal university patent pre-screening and coordinator review. Internal coordinator approval authorizes the disclosure for forward processing into statutory patent drafting. It does not constitute a legally granted patent from the Indian Patent Office (IPO) or Controller General of Patents, Designs and Trade Marks (CGPDTM).

---

## Table of Contents
1. [Project Overview & Key Capabilities](#1-project-overview--key-capabilities)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture & Database Schema](#3-system-architecture--database-schema)
4. [Application Lifecycle & State Machine](#4-application-lifecycle--state-machine)
5. [Local Development & Setup Guide](#5-local-development--setup-guide)
6. [Database Migrations & Row Level Security (RLS)](#6-database-migrations--row-level-security-rls)
7. [Authentication & Admin Role Provisioning](#7-authentication--admin-role-provisioning)
8. [Private Document Storage & Security](#8-private-document-storage--security)
9. [Automated Testing & Security Verification](#9-automated-testing--security-verification)
10. [Production Deployment & Custom Domain Setup](#10-production-deployment--custom-domain-setup)

---

## 1. Project Overview & Key Capabilities

- **Institutional Identity & Email Verification**: Accounts use an `@muj.manipal.edu` address and password, and work only after the 6-digit code emailed to that inbox is entered. Coordinators and super admins also enter an authenticator-app code (TOTP) at every sign-in.
- **Structured Multi-Step Disclosure Form**: 8-section form capturing applicant details, co-inventors, problem statement, technical description, novelty claims, and practical utility.
- **Draft Autosave & Incomplete Progress**: Students can save draft disclosures at any stage without mandatory validation blocking.
- **Private Document Management**: Complete specifications (PDF/DOCX), technical drawings (PDF/PNG), and guide NOCs are stored in private storage with short-lived (15-minute) signed access URLs.
- **Itemized Correction Workspace**: When the coordinator requests changes, students view exact field or document comments, edit the same application in place, replace flawed files, confirm resolution, and resubmit.
- **Strict Role-Based Access Control**: Student isolation prevents viewing or editing another student's disclosure. The Patent Coordinator has authorized administrative oversight over all departmental submissions.
- **Complete Audit Trail**: Immutable submission snapshots, status transition logs, actor IDs, reasons, and timestamps.
- **Zero AI or Template Gimmicks**: Restrained editorial UI (slate/navy palette, rectangular buttons, Inter typography, no purple gradients, no em dashes, no fake metrics).

---

## 2. Technology Stack

- **Programming Language**: TypeScript (Strict typing, `verbatimModuleSyntax`, zero `.js`/`.jsx` files).
- **Frontend Framework**: React 19 with Vite.
- **Routing**: React Router DOM (v7).
- **Form Validation**: React Hook Form with Zod schemas.
- **Styling**: Tailored institutional CSS design system (`src/styles/design-system.css`).
- **Icons**: Lucide React.
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) and custom PL/pgSQL security functions.
- **File Storage**: Private Supabase Storage bucket (`patent-documents`).
- **Testing**: Vitest with `@testing-library/react` and JSDOM.

---

## 3. System Architecture & Database Schema

### Database Entity Relational Overview

```
+-----------------------------------------------------------------------------------+
|                                     PROFILES                                      |
|  id (UUID PK) | university_email | full_name | role (student|admin) | department  |
+-----------------------------------------------------------------------------------+
       | 1
       |
       | owns
       v *
+-----------------------------------------------------------------------------------+
|                                   APPLICATIONS                                    |
|  id (UUID PK) | reference_number (UK) | owner_id (FK) | title | technical_field   |
|  background_problem | description | novelty_features | practical_applications      |
|  status (application_status enum) | current_version | submitted_at | timestamps   |
+-----------------------------------------------------------------------------------+
       |                   |                   |                     |
       | 1..*              | 0..*              | 1..*                | 0..*
       v                   v                   v                     v
+---------------+  +------------------+  +-------------------+  +-------------------+
|   INVENTORS   |  |   DOCUMENTS      |  |     VERSIONS      |  |    CORRECTIONS    |
| full_name     |  | storage_path     |  | version_number    |  | reviewer_id (FK)  |
| email         |  | category         |  | snapshot_data     |  | field_name        |
| affiliation   |  | file_size_bytes  |  | submitted_by (FK) |  | comment           |
| is_primary    |  | mime_type        |  | submitted_at      |  | status (pending|  |
| department    |  | version_number   |  | submission_notes  |  |  addressed)       |
+---------------+  +------------------+  +-------------------+  +-------------------+
```

### Core Entities Defined:
1. `profiles`: Connected to `auth.users`, records full name, role (`student` or `admin`), department, registration/employee number.
2. `applications`: Core record holding reference numbers (format: `MUJ-PAT-YYYY-XXXX`), ownership, structured claims, version counter, and state.
3. `inventors`: Normalized multi-inventor table supporting lead inventors and co-inventors with academic or external affiliations.
4. `application_documents`: Tracks document categories, storage keys, MIME types, and file sizes.
5. `application_versions`: Immutable JSONB snapshots captured upon initial submission and subsequent resubmissions.
6. `correction_requests`: Itemized reviewer feedback linked to specific application fields or documents.
7. `application_comments`: General or internal coordinator review notes.
8. `application_status_history`: Complete audit log of lifecycle changes, actors, reasons, and timestamps.
9. `notifications`: In-portal notification records delivered for review events and status updates.

---

## 4. Application Lifecycle & State Machine

Status transitions are governed by strict state machine rules:

```
[Draft] ----------> [Submitted] ----------> [Under Review]
 (Student)            (Student)                (Coordinator / Admin)
                                                   |
                        +--------------------------+--------------------------+
                        |                                                     |
                        v                                                     v
              [Corrections Required]                                [Approved for Next Stage]
             (Coordinator / Admin)                                 (Coordinator / Admin)
                        |
                        | (Student fixes issues)
                        v
                  [Resubmitted]
                   (Version +1)
                        |
                        v
                 [Under Review]
```

### Permitted Transitions:
- `draft` to `submitted`: Allowed for applicant owner when all mandatory fields are present.
- `submitted` to `under_review`: Allowed for coordinator / admin.
- `under_review` to `corrections_required`: Allowed for coordinator with itemized feedback.
- `corrections_required` to `resubmitted`: Allowed for student owner upon resolving all pending items.
- `resubmitted` to `under_review`: Allowed for coordinator / admin.
- `under_review` to `approved_next_stage`: Allowed for coordinator for internal patent cell forwarding.

---

## 5. Local Development & Setup Guide

### Prerequisites
- Node.js version 18 or newer (tested on Node v24).
- npm version 9 or newer.

### Installation Steps
```bash
# 1. Clone or navigate to the repository
cd c:/Users/Lenovo/Desktop/ecell

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the local development server
npm run dev
```

The portal will open at `http://localhost:5173`.

### Demo Mode and Test Personas
Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the portal runs in **demo mode**: data lives only in your browser, and nothing is a real security control. The login page has quick-fill buttons:
- **Student**: `Aditya Sharma` (`aditya.sharma@muj.manipal.edu`), already verified.
- **Coordinator**: `Patent Coordinator` (`patent.admin@muj.manipal.edu`), asked for an authenticator code at every sign-in.

Demo mode also simulates both security steps: registering a new account shows the emailed code in an on-page **Demo inbox**, and the coordinator sets up a real authenticator app (Google / Microsoft Authenticator) with a setup key.

---

## 6. Database Migrations & Row Level Security (RLS)

Tables, triggers, functions and Row Level Security policies live in `supabase/migrations/`, applied in filename order:
1. `001_initial_schema.sql`: base schema
2. `20261025000000_verified_auth_and_atomic_workflow.sql`: privilege fixes and atomic workflow RPCs
3. `20261029000000_super_admin_role.sql`: `super_admin` role
4. `20261029000100_frontend_direct_workflow.sql`: validated status changes, snapshots and notifications by trigger, super admin console
5. `20261029000200_email_otp_verification_and_mfa.sql`: email-code verification, coordinator TOTP (AAL2), daily draft limit, registration kill switch

(`20261021000000_init_patent_portal.sql` is an identical copy of `001_initial_schema.sql`.)

### Applying Migrations to Live Supabase:
**Before migration 5, configure Supabase Auth email (custom SMTP, "Confirm email" on, the code template).** It makes every existing email/password account verify by code at next sign-in. The full order is in `docs/security/email-otp-and-2fa.md` section 6.

```bash
npx supabase db push --db-url "<session pooler connection string>"
```
Safe-mode rollback for migration 5: `supabase/rollbacks/20261029000200_email_otp_verification_and_mfa.down.sql`.

### RLS Policies Summary:
- **Default Deny**: All tables require explicit policies.
- **Student Isolation**: `SELECT` and `UPDATE` on `applications` require `owner_id = auth.uid()` unless the user has `role = 'admin'`.
- **Privilege Protection**: The `trigger_profile_role_protect` trigger rejects any attempt by non-admins to alter their `role` column.
- **Audit Logging**: The `trigger_application_audit` trigger writes an immutable record to `application_status_history` on every status change.

---

## 7. Authentication & Admin Role Provisioning

### Student Registration and Sign-In
- Students register with an `@muj.manipal.edu` address and password. Supabase Auth emails a 6-digit code (valid 10 minutes, single use); the account works only after the code is entered.
- The `profiles` row (role `student`) is created only once the address is verified. Unverified users cannot file applications, and unverified sign-ups are purged after 24 hours.
- Details, threat model, deployment order and runbook: `docs/security/email-otp-and-2fa.md`.

### Coordinator (Admin) and Super Admin
1. Grant the role from the Supabase SQL Editor:
```sql
SELECT provision_admin_account('patent.admin@muj.manipal.edu');
UPDATE profiles SET role = 'super_admin' WHERE university_email = '<it admin email>';
```
2. At first sign-in they set up an authenticator app; every sign-in then asks for its 6-digit code. Until they enter it, the database treats them as a student (`is_admin()` requires an AAL2 session).
3. Students cannot grant themselves roles: role changes are blocked by trigger unless made by a super admin with TOTP, or from the SQL Editor.

---

## 8. Private Document Storage & Security

- **Bucket Name**: `patent-documents`
- **Visibility**: Strictly Private (Public access disabled).
- **Allowed MIME Types**: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`.
- **Maximum File Size**: 25 Megabytes (enforced on both client and database bucket policies).
- **Access Authorization**: Storage objects can only be downloaded by the application owner or authorized Patent Coordinator using 15-minute short-lived signed URLs generated via `createSignedUrl()`.

---

## 9. Automated Testing & Security Verification

The test suite is built on Vitest and covers validation schemas, workflow state transitions, API data operations, and security attack vectors.

### Running Automated Tests:
```bash
npm test          # frontend (Vitest)
npm run test:db   # database security and workflow checks against the real migrations (in-memory Postgres)
```

### Test Coverage Highlights:
1. **Schema Validation (`src/test/schemas.test.ts`)**:
   - Validates multi-inventor data, character length bounds, email formats.
2. **Workflow State Machine (`src/test/workflow.test.ts`)**:
   - Enforces valid transition paths and blocks unauthorized jumps.
3. **Data Access & Versioning (`src/test/api.test.ts`)**:
   - Tests draft creation, auto-generated reference numbers, formal submission, and version incrementing on resubmission.
4. **Security & Authorization (`src/test/security.test.ts`)**:
   - Verifies student-to-student data isolation (Student A cannot read Student B's disclosure).
   - Verifies privilege escalation prevention (students cannot change role to admin).
   - Verifies students cannot approve their own submissions.
   - Verifies oversized uploads (>25MB) and forbidden executable MIME types are rejected.

---

## 10. Production Deployment & Custom Domain Setup

### Frontend Build Command:
```bash
npm run build
```
The compiled production bundle is generated in `dist/`.

### Hosting Deployment:
1. Deploy the `dist/` directory to your university hosting platform (e.g. Vercel, Netlify, Cloudflare Pages, or institutional Nginx server).
2. Configure single-page application fallback routing so that all paths redirect to `index.html`.

### Custom Domain Configuration (e.g. `patents.muj.manipal.edu`):
1. In your university DNS management console, create a CNAME record:
   - **Host / Name**: `patents` (or `ipr`)
   - **Value / Target**: The CNAME provided by your hosting provider.
2. In Supabase Dashboard:
   - Navigate to **Authentication > URL Configuration**.
   - Add `https://patents.muj.manipal.edu` to **Site URL** and **Redirect URLs**.
3. SSL certificate will automatically provision over HTTPS.

---

