# RecoverAI — AI-Powered Revenue Recovery

> **Predict. Decide. Recover. With Control.**

RecoverAI is an AI-powered revenue recovery system designed for the **Razorpay AI Buildathon — AI Revenue Recovery Track**.

The system identifies failed or at-risk transactions, predicts the probability of successful recovery, determines the safest recovery action, and executes only policy-approved actions with auditability and stopping rules.

### Core Principle

> **ML predicts. The Node.js decision and safety engine decides what is allowed.**

---

## 1. Problem Statement

Payment failures, temporary banking issues, authentication failures, insufficient funds, and checkout interruptions can cause merchants to lose otherwise recoverable revenue.

A conventional retry system treats failures similarly and may repeatedly retry transactions even when recovery is unlikely.

RecoverAI addresses this problem by combining:

- Machine learning-based recovery prediction
- Transaction and failure analysis
- Risk-aware decision making
- Bounded automated recovery
- Safety rules and stopping conditions
- Recovery tracking
- Audit logging
- Revenue recovery analytics

The goal is not simply to retry payments, but to determine:

1. **Which transactions are worth recovering?**
2. **What intervention should be used?**
3. **Should the system act automatically or escalate?**
4. **When should the system stop?**

---

## 2. Solution Overview

RecoverAI follows an end-to-end AI revenue recovery workflow:

```text
Transaction Failure
        ↓
Transaction Analysis
        ↓
AI Recovery Probability Prediction
        ↓
Node.js Decision Engine
        ↓
Safety & Policy Checks
        ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    RETRY    │    NOTIFY   │   ESCALATE  │    STOP     │
└─────────────┴─────────────┴─────────────┴─────────────┘
        ↓
Recovery Result
        ↓
Database Update
        ↓
Audit Log
        ↓
Revenue Recovery Analytics
```

The system separates **prediction from action**.

The Python AI engine predicts recovery probability, while the Node.js decision and safety engine determines whether an action is permitted.

---

## 3. Key Capabilities

### AI-Powered Recovery Prediction

A Random Forest classifier predicts the probability that a failed transaction can be successfully recovered.

### Intelligent Action Selection

The system chooses between:

- `RETRY`
- `NOTIFY`
- `ESCALATE`
- `STOP`

### Safety Controls

Recovery actions are bounded by deterministic business rules.

Examples include:

- Maximum retry limit
- Failure-type restrictions
- Recovery probability thresholds
- Duplicate recovery protection
- Manual escalation for uncertain cases

### Transaction Analysis

Each transaction contains:

- Transaction amount
- Payment method
- Transaction status
- Failure code
- Failure reason
- Retry count
- AI recovery probability
- AI recommendation

### Auditability

Every recovery action can be recorded with:

- Transaction ID
- Action type
- Reason
- Recovery probability
- Result
- Timestamp
- Actor

### Revenue Analytics

The dashboard provides an overview of:

- Total transactions
- Failed transactions
- Recovered transactions
- Revenue at risk
- Simulated revenue recovered
- Recovery rate
- Recovery action performance

---

## 4. System Architecture

![RecoverAI System Architecture](docs/system-architecture.png)

### Architecture Flow

```text
┌───────────────────────────┐
│      React Frontend       │
│   Dashboard & Analysis    │
└─────────────┬─────────────┘
              │
              ↓
┌───────────────────────────┐
│    Node.js + Express      │
│      Backend API          │
└─────────────┬─────────────┘
              │
       ┌──────┴──────┐
       ↓             ↓
┌─────────────┐  ┌──────────────────┐
│    MySQL    │  │ Python FastAPI   │
│  Database   │  │   AI / ML Engine │
└─────────────┘  └────────┬─────────┘
                           │
                           ↓
                  ┌──────────────────┐
                  │ Random Forest ML  │
                  │ Recovery Model    │
                  └────────┬─────────┘
                           │
                           ↓
                  ┌──────────────────┐
                  │ Node Decision &  │
                  │ Safety Engine    │
                  └────────┬─────────┘
                           │
                           ↓
                  Recovery Action
                           │
                           ↓
                     Audit Log
```

### Architectural Principle

The frontend does not directly decide whether a transaction should be recovered.

The architecture follows:

```text
Frontend
   ↓
Backend
   ↓
AI Prediction
   ↓
Decision Engine
   ↓
Safety Rules
   ↓
Recovery Action
   ↓
Database + Audit Log
```

This provides separation between:

- User interface
- Business logic
- AI inference
- Safety enforcement
- Persistence
- Auditability

---

## 5. AI / ML Approach

RecoverAI uses a **Random Forest Classifier** to predict the probability of successful payment recovery.

The model is trained using **5,000 synthetic transactions**.

### Model Results

![RecoverAI ML Results](docs/ml-results.png)

The model achieved:

| Metric | Result |
|---|---:|
| Accuracy | **70.34%** |
| Precision | **80.00%** |
| F1 Score | **72.33%** |
| ROC-AUC | **0.7538** |

These predictions are used by the decision engine to identify potentially recoverable transactions.

### Important Design Principle

The ML model does **not** directly execute recovery actions.

Instead:

```text
ML Model
   ↓
Recovery Probability
   ↓
Node Decision Engine
   ↓
Safety Rules
   ↓
Allowed / Blocked Action
```

This prevents an AI prediction from bypassing business constraints.

---

## 6. AI Decision & Safety Engine

RecoverAI uses deterministic decision rules after AI prediction.

### Decision Rules

| Condition | Recommended Action | Automation |
|---|---|---|
| Retry limit reached | `STOP` | Blocked |
| Probability >= 70% + temporary bank failure | `RETRY` | Allowed |
| Probability >= 50% | `NOTIFY` | Controlled follow-up |
| Probability < 50% | `ESCALATE` | Manual review |

### Maximum Retry Limit

The system allows a maximum of:

```text
2 retry attempts
```

If the retry limit is reached, the transaction is automatically blocked from further automated recovery.

### Safety Override Example

Consider a transaction with:

```text
Recovery Probability = 78.24%
Retry Count = 2
Maximum Retry Limit = 2
```

Although the AI predicts a high recovery probability, the safety engine returns:

```text
Action = STOP
Automation = BLOCKED
Reason = Maximum retry limit reached
```

This demonstrates that **safety policy takes precedence over model confidence**.

---

## 7. Recovery Workflow

The recovery workflow is:

```text
1. Failed transaction enters the recovery queue
              ↓
2. Transaction features are collected
              ↓
3. Python ML engine predicts recovery probability
              ↓
4. Node.js decision engine evaluates the prediction
              ↓
5. Safety rules are applied
              ↓
6. Recovery action is selected
              ↓
7. Action is executed if permitted
              ↓
8. Transaction status is updated
              ↓
9. Recovery result is stored
              ↓
10. Audit event is created
              ↓
11. Dashboard metrics are updated
```

### Example Recovery Scenario

For a temporary bank timeout:

```text
Failure Code = BANK_TIMEOUT
Recovery Probability = High
Retry Count = 0
```

The decision engine can select:

```text
RETRY
```

If the simulated retry succeeds:

```text
Transaction Status → RECOVERED
Recovery Action → SUCCESS
Amount Recovered → Recorded
Audit Log → Created
```

---

## 8. Revenue Recovery Results

The dashboard evaluates the recovery opportunity using synthetic transaction data.

### Overall Results

| Metric | Result |
|---|---:|
| Total Transactions | **5,000** |
| Revenue at Risk | **₹16.84M** |
| Simulated Revenue Recovered | **₹6.77M** |
| Recovery Rate | **40.21%** |
| Successful Transactions | **2,000** |
| Failed Transactions | **1,404** |
| Not Attempted | **1,596** |

These results demonstrate how AI-assisted decision making can prioritize recovery opportunities while preventing unnecessary or unsafe retries.

### Action-Level Results

| Action | Transactions | Successful Recoveries | Success Rate |
|---|---:|---:|---:|
| `RETRY` | 1,353 | 1,111 | **82.11%** |
| `NOTIFY` | 424 | 266 | **62.74%** |
| `ESCALATE` | 1,627 | 623 | **38.29%** |
| `STOP` | 1,596 | — | — |

The results show that high-probability temporary failures are strong candidates for automated retry, while lower-confidence cases can be notified or escalated instead.

---

## 9. Dashboard

The RecoverAI dashboard provides a centralized view of revenue recovery performance.

The dashboard displays:

- Total transactions
- Failed transactions
- Recovered transactions
- Revenue at risk
- Revenue recovered
- Recovery rate
- Recovery queue
- Recent recovery activity
- AI recommendations

The interface is designed to allow a merchant or operator to quickly identify:

```text
What failed?
     ↓
Why did it fail?
     ↓
Can it be recovered?
     ↓
What does AI recommend?
     ↓
Is automation allowed?
     ↓
What happened after recovery?
```

---

## 10. Transaction Analysis

Each transaction can be analyzed individually.

The transaction analysis view provides:

- Transaction reference
- Customer
- Amount
- Payment method
- Current status
- Failure code
- Failure reason
- Retry count
- AI recovery probability
- AI recommendation

Example:

```text
Transaction: TXN-DEMO-RECOVER
Amount: ₹3,500
Payment Method: UPI
Failure Code: BANK_TIMEOUT
Retry Count: 0
AI Recommendation: RETRY
```

The transaction can then be sent through the recovery workflow.

---

## 11. Recovery Actions

RecoverAI supports four primary recovery actions.

### RETRY

Used for high-probability temporary payment failures.

Typical examples:

```text
BANK_TIMEOUT
BANK_ERROR
```

### NOTIFY

Used when the transaction may require customer intervention.

The system can recommend notification instead of automatically retrying.

### ESCALATE

Used when the transaction requires manual review or when recovery confidence is low.

### STOP

Used when automation must not continue.

Examples include:

```text
Retry limit reached
Unsafe repeated retry
Recovery policy restriction
```

---

## 12. Auditability & Safety

RecoverAI is designed around controlled automation.

### Safety Principles

#### 1. Bounded Automation

Automated recovery is permitted only when policy conditions are satisfied.

#### 2. Retry Limit

The maximum retry count prevents unlimited automated attempts.

#### 3. Duplicate Protection

A transaction that has already been successfully recovered cannot be recovered again through the same workflow.

#### 4. Deterministic Decision Layer

The AI prediction is evaluated by deterministic Node.js rules before action execution.

#### 5. Audit Trail

Recovery events are stored for traceability.

Example audit event:

```text
Event Type:
RECOVERY_EXECUTED

Actor:
AI_ENGINE

Description:
Simulated RETRY SUCCESS.
Amount recovered: ₹2800.00
```

### AI + Safety Separation

```text
             AI Prediction
                   ↓
          Recovery Probability
                   ↓
       ┌──────────────────────┐
       │ Node Decision Engine │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │   Safety Policies    │
       └──────────┬───────────┘
                  ↓
       ┌──────────────────────┐
       │ Allowed / Blocked    │
       └──────────┬───────────┘
                  ↓
           Recovery Action
```

This architecture ensures that the model cannot independently bypass safety constraints.

---

## 13. Database Design

RecoverAI uses **MySQL 8**.

The database is named:

```text
recover_ai
```

### Tables

```text
users
customers
transactions
recovery_actions
recovery_attempts
audit_logs
```

### Customers

Stores customer-level transaction statistics.

Important fields include:

```text
customer_ref
name
email
total_transactions
successful_transactions
failed_transactions
success_rate
```

### Transactions

Stores payment transaction information.

Important fields include:

```text
transaction_ref
customer_id
amount
payment_method
status
failure_code
failure_reason
retry_count
recovery_probability
ai_recommendation
```

### Recovery Actions

Stores the decision and execution details.

```text
transaction_id
action_type
reason
recovery_probability
executed_at
result
```

### Recovery Attempts

Stores individual recovery attempts.

```text
transaction_id
attempt_number
action_type
status
amount_recovered
attempted_at
```

### Audit Logs

Stores important system events.

```text
transaction_id
event_type
description
actor
created_at
```

The SQL schema and seed data are available in:

```text
database/recover_ai.sql
```

---

## 14. Project Structure

```text
recover-ai/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   │   ├── dashboardController.js
│   │   ├── recoveryController.js
│   │   └── transactionController.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── recoveryRoutes.js
│   │   └── transactionRoutes.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── recoveryEngine.js
│   ├── database/
│   │   └── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── ai-engine/
│   ├── data/
│   │   └── synthetic_transactions.csv
│   ├── api.py
│   ├── data_generator.py
│   ├── decision_engine.py
│   ├── evaluator.py
│   └── ml_model.py
│
├── database/
│   └── recover_ai.sql
│
├── docs/
│   ├── system-architecture.png
│   └── ml-results.png
│
├── .gitignore
└── README.md
```

---

## 15. API Endpoints

### Transactions

```text
GET /api/transactions
```

Returns transaction data for the dashboard and recovery queue.

```text
GET /api/transactions/:id
```

Returns details of a specific transaction.

### Dashboard

```text
GET /api/dashboard
```

Returns dashboard revenue recovery metrics.

### Recovery

```text
POST /api/recovery/:transactionId
```

Executes the recovery workflow for a transaction after applying AI and safety rules.

### AI Prediction

```text
POST /api/ai/predict
```

Sends transaction features to the Python AI engine and returns a recovery probability and recommendation.

---

## 16. Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Framer Motion
- Axios

### Backend

- Node.js
- Express.js

### AI / ML

- Python
- FastAPI
- Scikit-learn
- Random Forest Classifier

### Database

- MySQL 8

### Development & Testing

- Visual Studio Code
- Git
- GitHub
- Postman

---

## 17. Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/Harshvardhan1705/RecoverAI.git
cd RecoverAI
```

### 2. Configure MySQL

Create the database using:

```text
database/recover_ai.sql
```

The SQL file creates the required database, tables, relationships, and synthetic seed data.

### 3. Start Backend

```bash
cd backend
npm install
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

### 4. Start AI Engine

Open another terminal:

```bash
cd ai-engine
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn scikit-learn pandas numpy
```

Start the AI service:

```bash
python api.py
```

The FastAPI service runs on:

```text
http://127.0.0.1:8000
```

FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### 5. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available through the Vite development server.

---

## 18. Demonstration Scenarios

### Scenario 1 — High Probability Recovery

Example transaction:

```text
Transaction: TXN-DEMO-RECOVER
Amount: ₹3,500
Payment Method: UPI
Failure Code: BANK_TIMEOUT
Retry Count: 0
```

AI prediction:

```text
Recovery Probability ≈ 79.53%
Recommendation = RETRY
```

The decision engine permits the automated retry because:

```text
Probability >= 70%
AND
Failure Type = Temporary Bank Failure
AND
Retry Count < 2
```

The simulated recovery succeeds and the transaction becomes:

```text
RECOVERED
```

The system records:

```text
Recovery Action
Recovery Attempt
Amount Recovered
Audit Log
```

### Scenario 2 — Safety Override

Example transaction:

```text
Transaction: TXN-1096
Recovery Probability: 78.24%
Retry Count: 2
```

The AI confidence is high, but the safety engine blocks another retry:

```text
Action = STOP
Automation = BLOCKED
Reason = Maximum retry limit reached
```

This demonstrates the system's safety-first architecture.

---

## 19. Demo Video

**Demo Video:** [Watch the RecoverAI Demo](https://drive.google.com/file/d/18uwSPIXzokeS1BfITFzu8G1-2viVMj8G/view?usp=drive_link)

The demo covers:

```text
Dashboard
   ↓
System Architecture
   ↓
AI Recovery Queue
   ↓
Transaction Analysis
   ↓
AI Prediction
   ↓
Recovery Execution
   ↓
Safety Override
   ↓
Recent Activity & Audit Trail
   ↓
ML Results
```

---

## 20. Buildathon Track Alignment

RecoverAI is designed for the **AI Revenue Recovery** track.

The solution addresses the core revenue recovery workflow:

```text
Detect Revenue at Risk
        ↓
Predict Recovery Probability
        ↓
Determine Appropriate Intervention
        ↓
Apply Safety Constraints
        ↓
Execute Bounded Recovery
        ↓
Measure Recovery
        ↓
Record Audit Trail
```

### Revenue at Risk

The system identifies failed transactions and calculates the revenue opportunity associated with them.

### Right Intervention

The decision engine determines whether the appropriate intervention is:

```text
RETRY
NOTIFY
ESCALATE
STOP
```

### Bounded Recovery

Automated recovery is constrained by:

```text
Probability Thresholds
Failure-Type Rules
Retry Limits
Duplicate Protection
Safety Overrides
```

### Measurable Recovery

The dashboard tracks:

```text
Revenue at Risk
Revenue Recovered
Recovery Rate
Successful Recoveries
Action-Level Performance
```

### Auditability

Recovery actions and important system events are recorded in the database.

---

## 21. AI + Safety Architecture

RecoverAI follows an **AI-assisted but policy-controlled architecture**.

```text
                 ┌────────────────────┐
                 │   Transaction      │
                 │      Failure       │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │   Feature Input    │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │  Random Forest ML   │
                 │      Model         │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Recovery Probability│
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Decision Engine    │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Safety & Policy     │
                 │      Engine         │
                 └─────────┬──────────┘
                           ↓
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       Allowed          Blocked          Escalated
          ↓                ↓                ↓
       Recovery           STOP          Manual Review
          ↓
    Database + Audit
```

### Why This Architecture?

A machine learning model is probabilistic.

Business and financial actions require deterministic controls.

Therefore:

```text
AI = Prediction
Decision Engine = Business Logic
Safety Engine = Control
Database = State
Audit Log = Traceability
```

This separation improves reliability, explainability, and operational safety.

---

## 22. Future Scope

Potential future improvements include:

- Real Razorpay payment gateway integration
- Real-time webhook processing
- Production-grade payment retry orchestration
- More advanced ML models
- Customer segmentation
- Personalized recovery messaging
- Subscription recovery
- Checkout abandonment prediction
- Adaptive retry timing
- Fraud-aware recovery policies
- Merchant-specific recovery strategies
- Reinforcement learning for intervention optimization
- Real-time revenue recovery monitoring
- Advanced observability and alerting

---

## 23. Disclaimer

RecoverAI is a **buildathon prototype** using synthetic transaction data and simulated recovery outcomes.

It does not process real customer payment information or execute real financial transactions.

The recovery execution shown in the prototype is intentionally simulated for demonstration purposes.

---

## 24. Conclusion

RecoverAI demonstrates how AI can be combined with deterministic business rules and safety controls to create a practical revenue recovery system.

Instead of blindly retrying failed payments, RecoverAI follows a controlled workflow:

```text
Predict
   ↓
Decide
   ↓
Apply Safety Rules
   ↓
Recover When Allowed
   ↓
Measure
   ↓
Audit
```

The core idea is simple:

> **Use AI to identify recovery opportunities, but use deterministic controls to decide what the system is allowed to do.**

This makes RecoverAI an AI-powered revenue recovery system that is:

- Predictive
- Action-oriented
- Measurable
- Auditable
- Safety-aware
- Designed for bounded automation

---

## License

This project is developed as a prototype for the Razorpay AI Buildathon.