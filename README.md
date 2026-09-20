# Walkthrough - VakilSetu: Legal Help Made Accessible

We have created the full client-side prototype of **VakilSetu**, a premium legal accessibility web application. The application runs natively in any browser with zero installations or dependencies.

---

## 🛠️ Created Files

1. **[index.html](file:///d:/BNB/index.html)**: Sets up the structural framework of the single-page application (SPA) with a top navigation bar, semantic tabs (Case Analyzer, Advocate Matchmaker, Case Workspace, Rights Library), and a consultation booking overlay.
2. **[styles.css](file:///d:/BNB/styles.css)**: Implements the visual design system. Features slate-dark mode background, vibrant neon color gradients, glassmorphism card containers, animated gauges (viability score ring), custom chat bubbles, and progress roadmaps.
3. **[app.js](file:///d:/BNB/app.js)**: Holds the frontend logic, routing, keyword-based case analysis simulator, filterable database of legal experts, booking system, chat responses, and an AI Clause Auditor showcasing warning callouts inside mock contracts.

---

## 🚀 Key Interactive Features

- **AI Case Analyzer (Invisible Entry Point)**: Type in your legal scenario or select a demo prompt (e.g. Unpaid Invoice, Withheld Security Deposit, Used Car Warranty) and hit "Analyze Legal Options". Watch the pulsing AI loader compile the report containing:
  - Estimated case viability score (emerald/amber gauge).
  - Target practice area.
  - Filing fees and damages recovery estimates.
  - Playbook checklist of actionable steps.
- **Advocate Matchmaker**: Automatically filters advocates specializing in your specific case category. Features transparent flat-rate pricing menus, client ratings, and bar licensing verification checkmarks.
- **Consultation Booking & Escrow**: Click "Book Consultation" to trigger the booking wizard. Submit your notes to initialize your workspace!
- **Encrypted Case Workspace**:
  - **Secure Chat**: Chat directly with your advocate. Type messages to get instant, context-aware advice (e.g. asking about "court" or "fees").
  - **Case Roadmap Tracker**: Shows progress phases tailored to the litigation category.
  - **AI Clause Auditor**: Upload or click mock contracts ("Lease Agreement" / "Freelance Contract") and click **Scan File** to instantly highlight and flag predatory clauses with suggestions.
- **Rights Library**: Browse cards explaining consumer, labor, and tenant rights in plain English with expandable FAQ accordions.

---

## 🔍 How to Run & Verify

1. Open your file explorer, navigate to the folder `d:\BNB\`, and double-click **`index.html`** to launch the app in Chrome, Edge, Firefox, or Safari.
2. **First-time User Flow**:
   - On the Case Analyzer tab, click the **Withheld Security Deposit** prompt chip.
   - Click **Analyze Legal Options**. Wait 3 seconds for the AI auditing animation to complete.
   - In the results card, click **Match with Advocates**.
   - Select **Sarah Jenkins, Esq.** by clicking **Book Consultation**. Choose a flat fee package and hit confirm.
   - Check out the **Case Workspace** tab that opened!
   - Under the documents panel on the right, click **Scan File** next to `LeaseAgreement.pdf`. Look at the **AI Clause Auditor** highlight illegal late fees and access violations.
   - Type a question in the chat box like "What are our chances in Small Claims?" to get a response.

---

## 🛠️ Step 2 & 3 Enhancements (Added Features)

- **OTP Verification & Onboarding Overlay**: Users register through a multi-step verification wizard (Role Selection ➔ OTP Number Input with full clipboard copy-paste support ➔ Client/Advocate profile setup with local photo upload and avatar generation).
- **Matchmaker Case Search Engine**: Type queries like "divorce", "landlord kept deposit", or "assault charge" in the search bar. The engine parses the query and recommends the exact practice specialty, instantly filtering matching lawyers.
- **Detailed Consultations**: Booking form lets you describe your case, select Online/Offline consultation mode, and enter backup contacts. Workspace timeline and chat reflect these details automatically.
- **Vantage Folder Aesthetic**: Result cards have been re-themed to a squared folder layout using the Google Fonts `Fraunces` and `IBM Plex Sans/Mono` with terracotta dashed border lines.
- **Timeline Track Record**: Each advocate card has an expandable timeline showing 3-6 verified past cases (year, type, court level, role) with a mock public database disclaimer.
- **AI Plausibility Audit (Claude Sonnet)**: Submit your case text on any lawyer card to verify their plausibility match score and description stamp using the Claude API (with a robust keyword matching algorithm fallback).
- **Official Advocate Sign-Up & Consistency Checks**:
  - Adds a new navigation entry point: `"Are you a lawyer? List your practice"` on the intake screen.
  - Implements **State Bar Enrolment format checks**: validates codes (e.g. `MAH`, `D`, `UP`) matching dropdown states and checks year constraints (between 1961 and 2026).
  - Integrates **Claude AI Credential Consistency check**: checks if claimed years of experience align logically with their enrolment year (providing a green/red sanity verdict stamp).
  - Enforces **"Pending Verification" status**: registered lawyers receive a muted verification badge on their cards and header indicators, ensuring profiles undergo manual background audits before full live deployment.
- **Role-Specific Dashboards**:
  - Hides Case Analyzer & Matching tabs for lawyers since they do not need to look up other lawyers.
  - Dynamically updates navigation titles (e.g. Workspace becomes *"Client Caseload"*, Academy becomes *"Practice Guide"* for lawyers).
  - Implements **Advocate Caseload Panel**: Lawyers see their active clients (e.g. Rahul Verma, Meera Nair). Clicking a client opens a custom privilege-protected chat window, uploads directory, and lets the lawyer run contract audits on behalf of their clients.
- **Log Out / Switch Role Navigation**:
  - Adds a dynamic **"Log Out / Switch Role"** action link under the header profile card, making it extremely easy to toggle between Client and Lawyer views during hackathon pitching.

---

## 🔍 How to Run & Verify Onboarding & Track Records

1. Open **`index.html`** in your browser.
2. **Client Flow**:
   - Verify contact, input `1234` as OTP, complete your name, and match with lawyers.
   - Go to matchmaker, click Sarah Jenkins, book a consultation, fill details, and confirm.
   - You will land in the client's **Case Workspace**. Click **Log Out / Switch Role** under your name in the top right.
3. **Lawyer Flow (Instant Login with Demo Credentials)**:
   - Select **I am an advocate** on the intake screen.
   - Toggle to **Email Address**, type **`sarah@lawyer.com`**, and click **Get Verification Code**.
   - Input **`1234`** as OTP, and click **Verify Code**.
   - You will bypass the profile builder and log in directly as Sarah Jenkins, seeing her caseload dashboard (active clients, chat, files scan) instantly!
4. **Lawyer Official Sign-Up Flow (New Account)**:
   - On the welcome intake card, click the link **"Are you a lawyer? List your practice"** at the bottom.
   - Enter your name, select **Maharashtra (MAH)**, and input an enrolment number like `MAH/1234/2015`.
   - Under experience, type `10`. Click **Verify & Sign Up**.
   - Watch the stamp loader output **`SANITY CHECK PASSED`** (as 10 years experience is possible since 2015 enrolment).
   - The screen will transition, and you will see your lawyer profile added to the directory with a dashed grey **`Pending Verification`** badge.
   - Click **Log Out / Switch Role** in the header to switch back to client testing at any time!
