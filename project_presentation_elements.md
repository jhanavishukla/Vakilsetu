# Presentation Elements: VakilSetu – Legal Help Made Accessible

This document compiles the complete details of the **VakilSetu** project (architecture, features, database schema, APIs, and demo flows) to easily supply as elements for creating a PowerPoint presentation.

---

## Slide 1: Title & Vision
* **App Name:** VakilSetu
* **Tagline:** Legal Help Made Accessible
* **Vision Statement:** Bridging the gap in legal access for everyday citizens through automated case auditing, transparent flat-rate advocate matching, and secure digital workflows.
* **Core Theme:** Premium dark mode, slate/terracotta aesthetic, high-trust professional legal tech.

---

## Slide 2: The Problem
* **Jargon Barrier:** Legal terms and procedures are confusing and intimidating for common citizens.
* **Lack of Pricing Transparency:** Legal fees are unpredictable, often hidden, and barrier-to-entry is high.
* **Hard to Find the Right Specialist:** Finding lawyers who specialize in niche domains (like tenant security deposits or freelance contract disputes) is difficult.
* **Verification & Trust Gaps:** Citizens struggle to verify if an advocate is genuinely registered with the State Bar Council and what their track record is.

---

## Slide 3: The Solution – Core Pillars
1. **AI-Powered Case Intake & Diagnostics:**
   * Instant case analysis (estimated viability, practice area detection, filing cost estimates, actionable checklists).
2. **Transparent Advocate Matchmaking:**
   * Advocates categorized by specialties with public track records, user ratings, and upfront flat-rate service packages.
3. **Privilege-Protected Case Workspaces:**
   * Encrypted secure chat, interactive stage-by-stage roadmap tracking, and document/contract AI auditing.
4. **Verifiable Trust & Onboarding:**
   * OTP verification, DigiLocker integration, and AI-assisted State Bar enrollment sanity checking.

---

## Slide 4: Interactive Client Flow (The Demo)
* **Step 1: AI Diagnostic Intake**
  * Client types a scenario (e.g., *"Landlord won't return my ₹25,000 security deposit"*).
  * AI returns an 85% viability score, calculates filing costs, and outlines a step-by-step litigation playbook.
* **Step 2: Matching & Timelines**
  * Matchmaker filters tenancy lawyers. The user selects an advocate, views their verified past cases, and chooses a flat-fee package (e.g., *"Demand Letter & Review for ₹15,000"*).
* **Step 3: Secure Consultation**
  * Client inputs details, registers via OTP, and unlocks the secure Workspace.
* **Step 4: AI Contract Scan**
  * In the workspace, the client scans their lease agreement, and the **AI Clause Auditor** highlights predatory clauses with revision tips.

---

## Slide 5: Advocate Onboarding & Trust Verification
* **State Bar Validation:**
  * Enforces official State Bar Council enrollment number formats (e.g., `MAH/1234/2015`).
* **DigiLocker Integration:**
  * Connects with the government DigiLocker API to instantly verify lawyer credentials.
* **Claude AI Consistency Check:**
  * Checks if the advocate's claimed years of experience align logically with their enrollment year (e.g., flagging someone claiming 10 years experience but enrolled in 2024).
* **Pending Status:**
  * Newly registered lawyers are kept in a `Pending Verification` status with restricted visibility until manual audits pass.

---

## Slide 6: Role-Specific Dashboards
* **Client Dashboard:**
  * Case analyzer, list of matches, booking wizard, timeline roadmaps, and client-side document scanner.
* **Advocate Dashboard:**
  * Hides public matching tools to clean up the interface.
  * Displays active client caseloads, private privilege-protected chat windows, client document uploads, and contract scanning tools to audit files on behalf of clients.

---

## Slide 7: Technical Stack
* **Frontend:**
  * Single-Page Application (SPA) architecture.
  * UI: HTML5, Vanilla CSS3 (Slate dark mode, glassmorphism, responsive folders, custom neon gauges), Javascript (ES6+).
  * Icons: Lucide Icons.
* **Backend:**
  * Node.js with Express.js.
  * Middleware: CORS, body-parsers (configured for base64 file and avatar uploads).
* **Database & Persistence:**
  * LibSQL Client connecting to local SQLite or cloud-based Turso database instances.
* **Deployment:**
  * Optimized configuration for Vercel Serverless deployments.

---

## Slide 8: Database Schema Design
VakilSetu relies on three primary tables to manage credentials, bookings, and verified cases:

### 1. `lawyers` Table
Holds advocate profiles, credentials, and verification status.
* `id` (TEXT, Primary Key)
* `name` (TEXT, Not Null)
* `specialty` & `specialty_label` (TEXT)
* `bar_number` & `bar_council_id` (TEXT)
* `verification_status` (TEXT - e.g., `'pending'`, `'verified'`)
* `is_profile_completed` & `is_visible` (INTEGER)
* `packages` (TEXT - JSON array containing names, prices, and descriptions)
* `verified_cases` (TEXT - JSON array of past cases for track record verification)

### 2. `clients` Table
Holds client profiles and contact information.
* `id` (TEXT, Primary Key)
* `name` (TEXT, Not Null)
* `city` & `contact` (TEXT, Unique contact)
* `interest` (TEXT - target case category)
* `is_profile_completed` (INTEGER)

### 3. `bookings` Table
Tracks active legal consultations and workspaces.
* `id` (TEXT, Primary Key)
* `lawyer_id` & `client_id` (TEXT, Foreign Keys)
* `client_name` (TEXT)
* `brief` (TEXT - description of case)
* `date` & `mode` (TEXT - online/offline consultation mode)
* `status` (TEXT - defaults to `'New Inquiry'`)

---

## Slide 9: API Endpoints (The Core Backend Routes)
The Express router (`/api/*`) exposes the following endpoints:

| Endpoint | Method | Controller | Description |
| :--- | :--- | :--- | :--- |
| `/api/login` | POST | `authController` | Authenticates users (Clients & Lawyers) via mock OTP verification |
| `/api/analyze-case` | POST | `aiController` | Core AI engine analyzing input case text using Claude/keyword rules |
| `/api/lawyers` | GET | `lawyerController` | Fetches all verified/visible lawyers |
| `/api/lawyers` | POST | `lawyerController` | Registers a new advocate with bar details & Claude consistency check |
| `/api/lawyers/:id` | GET/PUT/DELETE | `lawyerController` | CRUD operations for advocate profiles |
| `/api/clients` | GET/POST | `clientController` | Registers and fetches client profile data |
| `/api/bookings` | POST | `bookingController` | Creates a consultation booking (initializes workspace) |
| `/api/bookings/:lawyerId`| GET | `bookingController` | Fetches bookings associated with a specific lawyer |
| `/api/lawyers/:id/verify` | PATCH | `lawyerController` | Admin endpoint to verify and activate an advocate |
| `/api/digilocker/verify` | POST | `lawyerController` | Validates advocate credentials against mock DigiLocker gateway |
