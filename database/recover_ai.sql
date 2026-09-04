-- RecoverAI Database Setup
CREATE DATABASE IF NOT EXISTS recover_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE recover_ai;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS recovery_attempts;
DROP TABLE IF EXISTS recovery_actions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
 id INT NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL,
 password VARCHAR(255) NOT NULL, role ENUM('MERCHANT','ADMIN') DEFAULT 'MERCHANT',
 created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customers (
 id INT NOT NULL AUTO_INCREMENT, customer_ref VARCHAR(50) NOT NULL, name VARCHAR(100) DEFAULT NULL,
 email VARCHAR(150) DEFAULT NULL, total_transactions INT DEFAULT 0, successful_transactions INT DEFAULT 0,
 failed_transactions INT DEFAULT 0, success_rate DECIMAL(5,2) DEFAULT 0.00,
 created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY customer_ref (customer_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE transactions (
 id INT NOT NULL AUTO_INCREMENT, transaction_ref VARCHAR(50) NOT NULL, customer_id INT NOT NULL,
 amount DECIMAL(12,2) NOT NULL, payment_method VARCHAR(30) NOT NULL,
 status ENUM('FAILED','RECOVERED','PENDING','REVIEW','STOPPED') DEFAULT 'FAILED',
 failure_code VARCHAR(50) DEFAULT NULL, failure_reason VARCHAR(255) DEFAULT NULL, retry_count INT DEFAULT 0,
 recovery_probability DECIMAL(5,2) DEFAULT NULL, ai_recommendation VARCHAR(50) DEFAULT NULL,
 created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY transaction_ref (transaction_ref),
 KEY customer_id (customer_id), CONSTRAINT transactions_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recovery_actions (
 id INT NOT NULL AUTO_INCREMENT, transaction_id INT NOT NULL,
 action_type ENUM('RETRY','NOTIFY','ESCALATE','STOP') NOT NULL, reason TEXT,
 recovery_probability DECIMAL(5,2) DEFAULT NULL, executed_at TIMESTAMP NULL DEFAULT NULL,
 result VARCHAR(100) DEFAULT NULL, created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (id), KEY transaction_id (transaction_id),
 CONSTRAINT recovery_actions_ibfk_1 FOREIGN KEY (transaction_id) REFERENCES transactions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recovery_attempts (
 id INT NOT NULL AUTO_INCREMENT, transaction_id INT NOT NULL, attempt_number INT NOT NULL,
 action_type VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL,
 amount_recovered DECIMAL(12,2) DEFAULT 0.00, attempted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (id), KEY transaction_id (transaction_id),
 CONSTRAINT recovery_attempts_ibfk_1 FOREIGN KEY (transaction_id) REFERENCES transactions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
 id INT NOT NULL AUTO_INCREMENT, transaction_id INT DEFAULT NULL, event_type VARCHAR(50) NOT NULL,
 description TEXT NOT NULL, actor VARCHAR(50) DEFAULT 'AI_ENGINE',
 created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY transaction_id (transaction_id),
 CONSTRAINT audit_logs_ibfk_1 FOREIGN KEY (transaction_id) REFERENCES transactions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO customers (id,customer_ref,name,email,total_transactions,successful_transactions,failed_transactions,success_rate,created_at) VALUES
(1,'CUST-001','Rahul Sharma','rahul@example.com',8,7,1,87.50,'2026-08-30 23:25:21'),
(2,'CUST-002','Priya Patil','priya@example.com',12,8,4,66.67,'2026-08-30 23:25:21'),
(3,'CUST-003','Amit Joshi','amit@example.com',5,2,3,40.00,'2026-08-30 23:25:21'),
(4,'CUST-004','Sneha Kulkarni','sneha@example.com',15,14,1,93.33,'2026-08-30 23:25:21');

INSERT INTO transactions (id,transaction_ref,customer_id,amount,payment_method,status,failure_code,failure_reason,retry_count,recovery_probability,ai_recommendation,created_at) VALUES
(1,'TXN-1092',1,4500.00,'UPI','RECOVERED','BANK_TIMEOUT','Temporary bank timeout',2,91.97,'STOP','2026-08-30 23:26:48'),
(2,'TXN-1093',2,8200.00,'CARD','PENDING','AUTH_FAILED','Authentication failed',0,37.02,'ESCALATE','2026-08-30 23:26:48'),
(3,'TXN-1094',3,12400.00,'CARD','REVIEW','INSUFFICIENT_FUNDS','Insufficient funds',0,24.02,'ESCALATE','2026-08-30 23:26:48'),
(4,'TXN-1095',4,2800.00,'UPI','RECOVERED','BANK_TIMEOUT','Temporary bank timeout',2,83.68,'STOP','2026-08-30 23:26:48'),
(5,'TXN-1096',1,6500.00,'NETBANKING','FAILED','BANK_ERROR','Bank service unavailable',2,78.24,'STOP','2026-08-30 23:26:48'),
(6,'TXN-DEMO-RECOVER',4,3500.00,'UPI','FAILED','BANK_TIMEOUT','Bank gateway timeout during payment processing',0,NULL,NULL,'2026-09-04 15:44:39');

INSERT INTO recovery_actions (id,transaction_id,action_type,reason,recovery_probability,executed_at,result,created_at) VALUES
(5,4,'RETRY','High recovery probability and temporary bank failure detected.',83.68,'2026-09-03 00:46:27','SUCCESS','2026-09-03 00:46:27');
INSERT INTO recovery_attempts (id,transaction_id,attempt_number,action_type,status,amount_recovered,attempted_at) VALUES
(2,4,2,'RETRY','SUCCESS',2800.00,'2026-09-03 00:46:27');
INSERT INTO audit_logs (id,transaction_id,event_type,description,actor,created_at) VALUES
(5,4,'RECOVERY_EXECUTED','Simulated RETRY SUCCESS. Amount recovered: ₹2800.00.','AI_ENGINE','2026-09-03 00:46:27');

ALTER TABLE customers AUTO_INCREMENT=5;
ALTER TABLE transactions AUTO_INCREMENT=7;
ALTER TABLE recovery_actions AUTO_INCREMENT=6;
ALTER TABLE recovery_attempts AUTO_INCREMENT=3;
ALTER TABLE audit_logs AUTO_INCREMENT=6;

SELECT id,transaction_ref,amount,status,failure_code,retry_count,recovery_probability,ai_recommendation FROM transactions ORDER BY id;
