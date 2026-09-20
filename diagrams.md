# Use-Case & Process Flow Diagrams: VakilSetu

This document contains visual diagrams for the **VakilSetu** platform, including a **Use-Case Diagram** and a **Process Flow Diagram (Sequence Flow)**, rendered in Mermaid syntax.

---

## 1. Use-Case Diagram
This diagram represents the actors (Client, Advocate, AI Engine) and their interactions with the key functionalities of the system.

```mermaid
graph TD
    %% Actors
    Client[("👤 Client")]
    Advocate[("⚖️ Advocate")]
    AIEngine[("🤖 AI Engine")]
    
    subgraph Client Use Cases
        UC1("Analyze Case & Viability Score")
        UC2("Scan Contracts for Predatory Clauses")
        UC3("Filter & Match with Advocates")
        UC4("Book Consultation Packages")
        UC5("Use Secure Workspace Chat")
    end
    
    subgraph Advocate Use Cases
        UC6("Register Profile & Input Enrolment Number")
        UC7("Perform DigiLocker Verification")
        UC8("Manage Active Clients Dashboard")
        UC9("Audit Contracts on Client's Behalf")
    end

    %% Client Connections
    Client --> UC1
    Client --> UC2
    Client --> UC3
    Client --> UC4
    Client --> UC5

    %% Advocate Connections
    Advocate --> UC5
    Advocate --> UC6
    Advocate --> UC7
    Advocate --> UC8
    Advocate --> UC9

    %% AI Connections
    AIEngine --> UC1
    AIEngine --> UC2
    AIEngine --> UC7
    AIEngine --> UC9
```

---

## 2. Process Flow Diagram (Sequence Flow)
This diagram illustrates the step-by-step interactive workflow of a client diagnosing a dispute, booking an advocate, and collaborating inside the workspace.

```mermaid
sequenceDiagram
    autonumber
    actor Client as 👤 Client
    participant App as 💻 VakilSetu Web App
    participant AI as 🤖 AI Diagnostic Engine
    participant DB as 🗄️ Database (SQLite/Turso)
    actor Advocate as ⚖️ Advocate

    %% AI Diagnostic Flow
    Client->>App: Enter legal scenario text
    App->>AI: Request legal analysis
    AI->>App: Return viability score & actionable roadmap
    App->>Client: Show diagnostic report

    %% Registration & Onboarding Flow
    Client->>App: Click 'Book Consultation'
    App->>Client: Request OTP verification
    Client->>App: Input code (1234)
    App->>DB: Register client profile
    DB-->>App: Registration successful

    %% Case Workspace Flow
    Client->>App: Confirm booking & package
    App->>DB: Save booking details
    App->>Client: Open secure Workspace
    Client->>App: Upload document (Lease/Agreement)
    App->>AI: Scan document for predatory terms
    AI-->>App: Return highlighted clauses & warnings
    App-->>Client: Show audited contract highlights
    Client->>App: Send message in privileged chat
    App->>DB: Save chat message
    DB-->>Advocate: Send notification

    %% Advocate Interaction Flow
    Advocate->>App: Login & open Client Caseload
    App->>DB: Fetch active cases
    DB-->>App: Return active case dashboard
    Advocate->>App: Review client contract audits & chat history
    Advocate->>App: Reply to client message
    App->>Client: Display reply in secure workspace
```
