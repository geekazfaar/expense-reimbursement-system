# Expense Reimbursement System

A full-stack PERN application where employees submit expense claims with receipts and administrators approve or reject them against annual category budgets.

## Features

**Employee**
- Register, log in, manage profile
- Submit claims with receipts, track status, cancel pending claims
- View remaining annual budget per category
- Comment on claims and view dashboard statistics

**Administrator**
- Manage employees (add, edit, search, deactivate)
- Manage categories and annual budgets
- View and filter all claims, approve or reject with a reason
- View receipts, comments, and dashboard statistics

## Tech Stack

- **Frontend:** React 19, Redux Toolkit, React Router, Vite
- **Backend:** Node.js, Express 5, JWT, bcrypt, Multer
- **Database:** PostgreSQL (`pg`)

### Packages

Exact versions are in each `package.json`.

- **Backend:** `express`, `pg`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`, `multer`, `nodemon` (dev)
- **Frontend:** `react`, `react-dom`, `@reduxjs/toolkit`, `react-redux`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, ESLint with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` (dev)

## Architecture

```
React (Redux Toolkit, React Router, Vite)
        |  HTTP / JSON
Express API (routes -> middleware -> controllers)
        |  SQL via pg
PostgreSQL (users, claims, categories, budgets, attachments, comments)
```

Request flow:

1. The user acts in the React frontend.
2. The frontend sends an HTTP request to the Express API.
3. Middleware handles authentication, authorization, and file uploads.
4. The controller validates the request and queries PostgreSQL.
5. The API returns a JSON response.
6. The frontend updates the displayed data.

## Project Structure

<!-- VERIFY: compare with the real repository tree -->

```
expense-reimbursement-system/
├── backend/
│   ├── src/
│   │   ├── controllers/   business logic and database queries
│   │   ├── middleware/    auth, authorization, uploads
│   │   ├── routes/        API endpoints
│   │   ├── app.js
│   │   └── server.js
│   └── uploads/           receipt files
├── frontend/
│   └── src/
│       ├── pages/         auth, employee, admin
│       └── redux/         global state
└── database/              schema SQL
```

## Getting Started

**Requirements:** Node.js, npm, PostgreSQL (running), Git

```bash
git clone https://github.com/geekazfaar/expense-reimbursement-system.git
cd expense-reimbursement-system
```

### 1. Database

<!-- VERIFY: database name and schema filename -->

```bash
createdb expense_reimbursement
psql -d expense_reimbursement -f database/<schema_file>.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

<!-- VERIFY: variable names against the actual code -->

```env
PORT=5001
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/expense_reimbursement
JWT_SECRET=replace_with_a_long_random_secret
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs at `http://localhost:5173`. If that port is busy, Vite uses another one and prints the URL.

## API Overview

Protected routes need `Authorization: Bearer <token>`.

<!-- VERIFY: methods and access levels against the route files -->

| Endpoint                  | Method | Access        | Purpose                      |
| ------------------------- | ------ | ------------- | ---------------------------- |
| `/api/auth/register`      | POST   | Public        | Register an employee         |
| `/api/auth/login`         | POST   | Public        | Log in and get a JWT         |
| `/api/users/profile`      | GET, PUT | Authenticated | View or update own profile |
| `/api/users`              | -      | Admin         | Employee management          |
| `/api/categories`         | -      | Authenticated / Admin | Manage categories    |
| `/api/budgets`            | -      | Authenticated / Admin | Manage annual budgets |
| `/api/claims`             | GET, POST | Authenticated | Submit and list own claims |
| `/api/claims/admin/all`   | GET    | Admin         | List all claims              |
| `/api/claims/:id/approve` | PATCH  | Admin         | Approve a pending claim      |
| `/api/claims/:id/reject`  | PATCH  | Admin         | Reject a pending claim       |
| `/api/claims/:id/cancel`  | PATCH  | Owner         | Cancel a pending claim       |
| `/api/comments/:id`       | GET, POST | Authenticated | Claim comments            |

## Business Rules

- Claim statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- No future-dated claims; quantity and unit price must be positive
- Only pending claims can be approved, rejected, or cancelled
- Only approved claims count against the annual category budget
- Receipts: PDF, JPEG, PNG; max 5 files, 5 MB each
- Employees can access only their own claims and receipts
- Passwords are hashed with bcrypt; inactive accounts are blocked

## Author

Azfaar Khan · [github.com/geekazfaar](https://github.com/geekazfaar)


