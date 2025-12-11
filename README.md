# Financial Ledger API

A backend financial ledger system built using **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.  
It implements **double-entry bookkeeping**, ensures **ACID guarantees**, and uses strict transactional safety for all financial operations.

---

## 🚀 Features

- Create user accounts  
- Deposit funds  
- Withdraw funds  
- Transfer funds between accounts  
- Strict double-entry accounting (every operation = 1 debit + 1 credit)  
- Account balance derived only from immutable ledger entries  
- Prevents overdrafts / negative balances  
- All money movement wrapped in ACID transactions  
- Implements **SERIALIZABLE isolation** for high integrity  
- Docker support for easy evaluation

---

## 🧰 Tech Stack

| Component    | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js (v20)           |
| Framework    | Express.js              |
| Database     | PostgreSQL (v18)        |
| ORM          | Prisma ORM (v6.x)       |
| Container    | Docker + docker-compose |

---

# 1. Setup & Running the Project

You can run the project in two ways:

✔ Local Setup (Node + Local PostgreSQL)  
✔ Docker Setup (recommended)

---

# 1.1 Local Setup

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Create `.env`

Your `.env` must include:

```env
DATABASE_URL="postgresql://postgres:YOURPASSWORD@localhost:5432/ledgerdb"
PORT=3000
```

An `.env.example` file is provided.  
Create your environment file:

```bash
cp .env.example .env
```

### 3️⃣ Initialize database schema

```bash
npx prisma db push
npx prisma generate
```

### 4️⃣ Set recommended isolation level

```sql
ALTER DATABASE ledgerdb SET DEFAULT_TRANSACTION_ISOLATION TO 'serializable';
```

### Why SERIALIZABLE?

`SERIALIZABLE` prevents anomalies such as:

- Phantom reads  
- Write skew  
- Lost updates  

This ensures that **two concurrent withdrawals or transfers cannot produce a negative balance**.  
It provides the strongest correctness guarantees for financial systems.

### 5️⃣ Start development server

```bash
npm run dev
```

Base URL:  
```
http://localhost:3000
```

---

# 1.2 Docker Setup (Recommended)

### 1️⃣ Create Docker `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/ledgerdb"
PORT=3000
```

### 2️⃣ Start full stack

```bash
docker-compose up --build
```

This launches:

- PostgreSQL (`db`)
- Node.js API (`app`)

Prisma schema is automatically applied at startup.

---

# 2. API Endpoints

---

## 2.0 Health Check  
**GET `/health`**

Response:

```json
{ "status": "ok" }
```

---

## 2.1 Create Account  
**POST `/accounts`**

Request:

```json
{
  "userId": "user1",
  "accountType": "savings",
  "currency": "INR"
}
```

---

## 2.2 Get Account (with Balance)  
**GET `/accounts/:id`**

Response:

```json
{
  "id": "ACCOUNT_ID",
  "userId": "user1",
  "accountType": "savings",
  "currency": "INR",
  "status": "active",
  "ledgerEntries": [...],
  "balance": 1250
}
```

---

## 2.3 Get Ledger Entries  
**GET `/accounts/:id/ledger`**

---

## 2.4 Deposit  
**POST `/deposits`**

Request:

```json
{
  "accountId": "ACCOUNT_ID",
  "amount": 500,
  "currency": "INR"
}
```

---

## 2.5 Withdrawal  
**POST `/withdrawals`**

Request:

```json
{
  "accountId": "ACCOUNT_ID",
  "amount": 300,
  "currency": "INR"
}
```

Insufficient funds:

```json
{ "error": "Insufficient balance" }
```

---

## 2.6 Transfer  
**POST `/transfers`**

Request:

```json
{
  "fromAccountId": "A",
  "toAccountId": "B",
  "amount": 300,
  "currency": "INR",
  "description": "Payment"
}
```

---

# 3. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AccountStatus { active frozen }
enum TransactionStatus { pending completed failed }
enum EntryType { debit credit }

model Account {
  id            String        @id @default(uuid())
  userId        String
  accountType   String
  currency      String
  status        AccountStatus @default(active)
  createdAt     DateTime      @default(now())
  ledgerEntries LedgerEntry[]
}

model Transaction {
  id              String            @id @default(uuid())
  transactionType String
  amount          Decimal           @db.Decimal()
  currency        String
  status          TransactionStatus
  description     String?
  createdAt       DateTime          @default(now())
  ledgerEntries   LedgerEntry[]
}

model LedgerEntry {
  id            String     @id @default(uuid())
  accountId     String
  transactionId String
  entryType     EntryType
  amount        Decimal     @db.Decimal()
  createdAt     DateTime    @default(now())
  account       Account     @relation(fields: [accountId], references: [id])
  transaction   Transaction @relation(fields: [transactionId], references: [id])

  @@index([accountId, createdAt])
}
```

---

# 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
  Account ||--o{ LedgerEntry : "has many"
  Transaction ||--o{ LedgerEntry : "has many"

  Account {
    string id PK
    string userId
    string accountType
    string currency
    string status
    datetime createdAt
  }

  Transaction {
    string id PK
    string transactionType
    decimal amount
    string currency
    string status
    string description
    datetime createdAt
  }

  LedgerEntry {
    string id PK
    string accountId FK
    string transactionId FK
    string entryType
    decimal amount
    datetime createdAt
  }
```

---

# 5. Architecture Diagram

```mermaid
flowchart LR
  Client[Postman / Client] --> API[Express Routes]
  API --> Controllers
  Controllers --> Services
  Services --> Prisma[Prisma ORM]
  Prisma --> DB[(PostgreSQL)]
  DB --> AccountTable[(Account Table)]
  DB --> TransactionTable[(Transaction Table)]
  DB --> LedgerTable[(LedgerEntry Table)]
```

---

# 6. Transfer Flow (Sequence Diagram)

```mermaid
sequenceDiagram
  participant C as Client
  participant A as Express API
  participant S as Service Layer
  participant P as Prisma
  participant D as PostgreSQL

  C->>A: POST /transfers
  A->>S: validate request
  S->>P: prisma.$transaction()
  P->>D: BEGIN
  S->>D: select balance from ledger
  S->>D: insert Transaction row
  S->>D: insert debit entry (source)
  S->>D: insert credit entry (destination)
  P->>D: COMMIT
  A-->>C: Transfer successful
```

---

# 7. Design Decisions

## 7.1 Double-Entry Bookkeeping
Every money movement creates **two ledger entries**:

- Debit (money out)  
- Credit (money in)

This ensures:

- Immutable auditability  
- No accidental money creation  
- Perfect traceability  

---

## 7.2 Ensuring ACID Properties

### Atomicity  
All operations use:

```js
await prisma.$transaction(async (tx) => { ... });
```

If any step fails → the entire operation rolls back.

### Consistency  
Inputs, constraints, and business rules ensure no invalid states (e.g., overdrafts).

### Isolation  
The system uses **SERIALIZABLE isolation**, the strictest level.

**Why SERIALIZABLE?**  
It prevents:

- Write skew  
- Phantom reads  
- Invisible concurrent ledger updates  

This ensures two concurrent withdrawals cannot produce a negative balance.

### Durability  
PostgreSQL’s WAL (Write-Ahead Logging) ensures data survives crashes.

---

## 7.3 Balance Calculation & Negative Balance Prevention

Balance is **never stored**.  
It is computed as:

```
SUM(credits) - SUM(debits)
```

Before withdrawal/transfer:

1. Compute balance **inside the transaction**  
2. Compare requested amount  
3. If insufficient → throw error  
4. Transaction rolls back → **no ledger corruption**

---

# 8. Postman Collection

A complete Postman collection is included:

```
financial-ledger-api.postman_collection.json
```

It contains:

- Automatic account creation  
- Auto-saving account IDs  
- Deposit, withdrawal, and transfer workflows  
- Fully working examples  

---

# 9. Author

**Ch V M Kiran**  
GitHub: https://github.com/ChVMKiran
