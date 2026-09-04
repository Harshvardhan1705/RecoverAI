# RecoverAI — AI-Powered Revenue Recovery

> **Predict. Decide. Recover. With Control.**

RecoverAI is an AI-powered revenue recovery system designed to identify failed or at-risk payment transactions, estimate their probability of successful recovery, recommend the right intervention, and execute recovery actions within deterministic safety guardrails.

The core principle of RecoverAI is:

**AI predicts. Policy decides. Safety controls. Recovery executes. Audit records.**

---

## 1. Problem Statement

Payment failures and checkout issues can create significant revenue leakage for merchants.

A failed payment does not always represent permanently lost revenue. Some failures may be recoverable through an appropriate retry, customer notification, or manual intervention.

However, blindly retrying every failed transaction can result in:

- Unnecessary payment attempts
- Poor customer experience
- Repeated failures
- Operational overhead
- Increased recovery risk
- Lack of control over automated actions

RecoverAI addresses this problem by combining machine learning, decision rules, safety guardrails, controlled recovery execution, revenue measurement, and auditability.

The system answers three key questions:

1. **Which transactions are worth recovering?**
2. **What intervention should be used?**
3. **When should automation stop?**

---

## 2. Solution Overview

RecoverAI evaluates a failed or at-risk transaction through a controlled AI-assisted recovery pipeline.

```text
                    FAILED / AT-RISK TRANSACTION
                                |
                                v
                    TRANSACTION + CUSTOMER DATA
                                |
                                v
                         PYTHON ML ENGINE
                                |
                                v
                     RECOVERY PROBABILITY
                                |
                                v
                      NODE.JS DECISION ENGINE
                                |
                                v
                       SAFETY & POLICY CHECK
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
           RETRY              NOTIFY           ESCALATE
             |
             v
       CONTROLLED RECOVERY
             |
             v
      DATABASE STATE UPDATE
             |
             v
        RECOVERY RESULT
             |
             v
         AUDIT TRAIL

The ML model does not directly execute a recovery action.

Instead, the ML model produces a recovery probability. The backend decision engine evaluates that prediction together with transaction context and deterministic safety rules before allowing any recovery action.

3. Key Capabilities
AI-Based Recovery Prediction

RecoverAI uses a Random Forest classifier to estimate the probability that a failed payment can be successfully recovered.

Intelligent Decisioning

The system converts the predicted recovery probability and payment failure context into a recommended intervention.

Safety Guardrails

Deterministic safety rules prevent unsafe automation, including repeated retries after the configured retry limit.

Controlled Recovery Execution

Allowed recovery actions are executed through a controlled simulation layer.

Revenue Recovery Measurement

The system measures revenue at risk, recovered revenue, recovery rate, recovery attempts, and action-level performance.

AI Recovery Queue

Transactions requiring attention are organized into an operational recovery queue.

Transaction-Level Analysis

Operators can inspect transaction amount, payment method, failure reason, retry count, recovery probability, recommended action, and safety status.

Auditability

Recovery decisions and execution outcomes are persisted for traceability and operational review.

4. System Architecture

The RecoverAI architecture separates the user interface, backend orchestration, machine learning inference, database persistence, and recovery execution responsibilities.

Architecture Layers
Frontend: React.js — Provides the operations dashboard, transaction analysis, AI recovery queue, recovery actions, and monitoring.
Backend: Node.js + Express.js — Provides the API layer, orchestration, decision engine, recovery workflow, and audit logging.
AI Engine: Python + FastAPI — Provides ML inference and recovery probability prediction.
Database: MySQL — Stores transactions, customers, recovery actions, recovery attempts, users, and audit logs.
Recovery Layer: Controlled Simulation — Demonstrates bounded recovery actions and simulated outcomes.
End-to-End Flow
A failed transaction is loaded by the backend.
Transaction and customer context are prepared for inference.
The Node.js AI service calls the Python FastAPI prediction endpoint.
The Random Forest model returns a recovery probability.
The Node.js decision engine evaluates the probability and failure type.
The safety engine checks retry limits and automation eligibility.
An allowed recovery action is executed through the controlled recovery workflow.
Transaction and recovery state are persisted in MySQL.
The decision and execution are written to the audit trail.
5. AI / ML Approach

RecoverAI uses a Random Forest Classifier to estimate the probability of successful payment recovery.

Model Objective

Target: Recovery success

The model learns from transaction-level attributes to distinguish transactions that are more likely to be successfully recovered from those that are less likely to recover.

Demonstration Dataset
Dataset size: 5,000 synthetic transactions
Observed outcomes: 3,404 transactions with recovery outcomes
Successful recoveries: 2,000
Failed recovery outcomes: 1,404
Train/Test split: 2,723 / 681 observed transactions
Model Performance
Accuracy: 70.34%
Precision: 80.00%
Recall: 66.00%
F1 Score: 72.33%
ROC-AUC: 0.7538

These metrics are from the project's synthetic demonstration dataset and are not production Razorpay performance.

Feature Context

The prediction pipeline uses transaction and customer/payment context, including:

Transaction amount
Payment method
Failure code
Retry count
Customer historical success rate

The model produces a recovery probability that is subsequently evaluated by the backend decision and safety layer.

6. AI Decision & Safety Engine

A central architectural principle of RecoverAI is the separation between prediction and execution.

                         ML MODEL
                            |
                            v
                  RECOVERY PROBABILITY
                            |
                            v
                    DECISION ENGINE
                            |
                            v
                     SAFETY ENGINE
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
            RETRY         NOTIFY       ESCALATE
              |
              v
       CONTROLLED RECOVERY
              |
              v
          AUDIT TRAIL
Decision Policy
Condition	Action	Automation
Retry limit reached	STOP	Blocked
Probability >= 70% + temporary bank failure	RETRY	Allowed
Probability >= 50%	NOTIFY	Controlled follow-up
Probability < 50%	ESCALATE	Manual review

The configured maximum retry limit is 2 attempts.

A high model probability cannot bypass deterministic safety constraints.

Example Safety Override

Recovery Probability: 78.24%

Recommended Action: STOP

Retry Count: 2 / 2

Reason: Maximum retry limit reached.

Automated recovery is blocked to prevent repeated payment attempts.

This demonstrates that RecoverAI does not blindly execute a high-confidence model prediction. The safety engine has final control over whether an automated recovery action is permitted.

7. Recovery Workflow
                 FAILED TRANSACTION
                         |
                         v
                    AI ANALYSIS
                         |
                         v
                 RECOVERY DECISION
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
        RETRY          NOTIFY       ESCALATE
          |
          v
      SAFETY CHECK
          |
          v
   CONTROLLED ACTION
          |
       +--+--+
       |     |
       v     v
  RECOVERED FAILED
       |
       v
  AUDIT + METRICS

For an automated retry:

AI inference is requested.
Recovery probability is calculated.
Decision rules select the recommended action.
Safety checks determine whether automation is permitted.
The controlled recovery workflow executes the action.
The transaction state is updated.
Recovery attempt and action records are created.
An audit event is persisted.
8. Revenue Recovery Results

RecoverAI evaluates recovery performance across the demonstration dataset.

Overall Results
Transactions evaluated: 5,000
Revenue at risk: ₹16.84M
Simulated recovered revenue: ₹6.77M
Overall recovery rate: 40.21%
Successful recoveries: 2,000
Failed recovery outcomes: 1,404
Transactions not attempted: 1,596

These figures represent the project's synthetic demonstration environment and controlled recovery simulation.

Action-Level Results
Action	Transactions	Successful	Recovery Rate
RETRY	1,353	1,111	82.11%
NOTIFY	424	266	62.74%
ESCALATE	1,627	623	38.29%
STOP	1,596	-	-

The results demonstrate how recovery opportunities can be prioritized while maintaining bounded automation.

9. Dashboard

The RecoverAI dashboard provides an operational view of payment recovery.

It includes:

Total transactions
Revenue at risk
Recovered revenue
Recovery rate
AI recovery queue
Transaction-level recovery analysis
Recommended recovery actions
Recent recovery activity
Recovery outcomes
Audit information

The dashboard is designed to help an operations team understand where revenue is at risk and which transactions require attention.

10. Transaction Analysis

Each transaction can be analyzed using payment and customer context.

The system provides:

Transaction amount
Payment method
Failure code
Failure reason
Retry count
Customer historical success rate
AI recovery probability
Recommended recovery action
Safety status
Recovery execution result
Example

A transaction with:

A temporary bank failure
High recovery probability
Retry count below the configured maximum

may qualify for an automated retry.

A transaction with a high recovery probability but an already exhausted retry limit is stopped by the safety engine.

11. Recovery Actions

RecoverAI supports four recovery action types.

RETRY

Used when the transaction has a high probability of recovery and the failure is considered temporarily recoverable.

NOTIFY

Used when customer interaction or follow-up may be appropriate.

ESCALATE

Used when automated recovery is not appropriate and manual intervention is required.

STOP

Used when further automation is not allowed, such as after reaching the retry limit.

12. Auditability & Safety

Every recovery execution is designed to leave an auditable record.

The system records:

Transaction reference
Recovery action
Recovery probability
Action reason
Execution result
Recovery attempt
Timestamp
Actor
Audit event

The recovery lifecycle can therefore be traced as:

Prediction
    |
    v
Decision
    |
    v
Safety Check
    |
    v
Execution
    |
    v
Database Update
    |
    v
Audit Log

The safety layer ensures that model confidence alone cannot trigger unlimited automated actions.

13. Database Design

RecoverAI uses MySQL for persistent application and recovery state.

Core Tables
users

Stores merchant and administrator accounts.

customers

Stores customer identity and historical transaction success information.

transactions

Stores payment transaction details, failure information, recovery probability, recommendation, status, and retry count.

recovery_actions

Stores the recovery action selected or executed for a transaction.

recovery_attempts

Stores individual recovery attempts and their outcomes.

audit_logs

Stores recovery-related audit events for traceability.

Database Relationship
CUSTOMERS
    |
    | 1 : N
    v
TRANSACTIONS
    |
    +-------------------------+
    |                         |
    | 1 : N                   | 1 : N
    v                         v
RECOVERY_ACTIONS       RECOVERY_ATTEMPTS
    |
    |
    +-------------------------+
                              |
                              v
                         AUDIT_LOGS

The SQL schema and demonstration data are provided in:

database/recover_ai.sql

14. Project Structure
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
15. API Endpoints
Transaction APIs
GET /api/transactions
GET /api/transactions/:id

Used to retrieve transaction and recovery information.

Dashboard API
GET /api/dashboard

Provides dashboard-level recovery and revenue metrics.

Recovery API
POST /api/recovery/:transactionId

Triggers the controlled recovery workflow for a transaction.

AI API
POST /api/ai/predict

Requests recovery probability prediction from the Python AI engine.

FastAPI Documentation

The Python FastAPI service exposes interactive API documentation through its Swagger interface during local development.

16. Technology Stack
Frontend
React.js
Vite
Tailwind CSS
Recharts
Lucide React
Framer Motion
Axios
Backend
Node.js
Express.js
AI / Machine Learning
Python
FastAPI
Scikit-learn
Random Forest Classifier
Database
MySQL 8
Development & Testing
VS Code
Git
GitHub
Postman
17. Local Setup
Prerequisites

Install:

Node.js
npm
Python 3.x
MySQL 8
Git
Clone the Repository
git clone https://github.com/Harshvardhan1705/RecoverAI.git
cd RecoverAI
Database Setup

Use the SQL file:

database/recover_ai.sql

The SQL file creates the RecoverAI database, tables, relationships, and demonstration data.

Backend Setup
cd backend
npm install

Configure the database connection using the required backend environment variables.

Start the backend:

node server.js
AI Engine Setup

Open a new terminal:

cd ai-engine
python -m venv venv

Activate the virtual environment and install the required Python dependencies.

Start the FastAPI service:

python api.py

The AI engine provides the prediction API used by the Node.js backend.

Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The Vite development server will provide the RecoverAI dashboard.

18. Demonstration Scenarios
Scenario 1 — Automated Recovery

A failed transaction has:

High recovery probability
Temporary bank failure
Retry count below the maximum

RecoverAI recommends RETRY and allows the controlled recovery workflow to execute.

Scenario 2 — Safety Override

A transaction has:

High recovery probability
Retry count already at the maximum

RecoverAI recommends STOP because the safety policy blocks another automated attempt.

Scenario 3 — Manual Escalation

A transaction has:

Low recovery probability
A failure type unsuitable for automated recovery

RecoverAI recommends ESCALATE for manual review.

19. Demo Video
RecoverAI — AI Revenue Recovery Demo

The demo demonstrates the complete product workflow, including:

Problem and solution
System architecture
Recovery dashboard
AI recovery queue
Transaction analysis
AI recovery probability
Automated recovery simulation
Safety override
Recent activity and audit trail
ML model performance

Demo Video: **Demo Video:** [Watch the RecoverAI Demo](https://drive.google.com/file/d/18uwSPIXzokeS1BfITFzu8G1-2viVMj8G/view?usp=drive_link)

20. Buildathon Track Alignment

RecoverAI is designed for the AI Revenue Recovery track.

Detect Revenue at Risk

The system analyzes failed transactions and estimates the probability of successful recovery.

Determine the Right Intervention

The decision engine maps AI predictions and transaction context to:

RETRY
NOTIFY
ESCALATE
STOP
Execute a Bounded Recovery Workflow

Allowed recovery actions are executed through a controlled simulation with deterministic safety rules.

Stopping Rules

The system enforces a maximum retry limit and blocks further automated attempts when that limit is reached.

Measure Money Recovered

The dashboard tracks:

Revenue at risk
Recovered revenue
Recovery rate
Recovery attempts
Action-level recovery performance
Audit Trail

Recovery actions and execution outcomes are persisted for traceability.

21. AI + Safety Architecture

RecoverAI follows a layered approach in which machine learning provides intelligence while deterministic controls govern execution.

                  AI PREDICTION
                       |
                       v
                DECISION ENGINE
                       |
                       v
                 SAFETY ENGINE
                       |
          +------------+------------+
          |            |            |
          v            v            v
        RETRY        NOTIFY      ESCALATE
          |
          v
     CONTROLLED
      RECOVERY
          |
          v
      AUDIT TRAIL

This design ensures that AI intelligence is combined with deterministic controls.

The model can recommend an action, but the safety layer determines whether the action is actually permitted.

22. Future Scope

RecoverAI can be extended with:

Direct payment gateway integration
Real-time payment event ingestion
Production-grade customer notification workflows
Advanced recovery models
Model monitoring and drift detection
Merchant-specific recovery policies
Explainable AI for recovery predictions
Adaptive retry timing
Multi-channel recovery orchestration
Real-time revenue recovery analytics

The current implementation intentionally uses a controlled recovery simulation rather than executing real payment operations.

23. Disclaimer

RecoverAI is a buildathon prototype created to demonstrate AI-driven revenue recovery concepts.

The project uses synthetic demonstration data and a controlled recovery simulation.

It does not process real customer payment information or execute real payment transactions.

The ML performance metrics shown in this README are demonstration results and should not be interpreted as production payment recovery performance.

24. Conclusion

RecoverAI demonstrates how AI can be used to move beyond simply detecting payment failures toward an intelligent, controlled revenue recovery workflow.

The system combines:

Predict → Decide → Apply Safety → Recover → Measure → Audit

The key principle is:

AI recommends. Policy controls. Recovery executes. Audit records.