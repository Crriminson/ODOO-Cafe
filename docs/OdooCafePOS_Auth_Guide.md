# Odoo Cafe POS — Authentication System Guide

> A complete implementation reference for the JWT-based authentication system defined in the project spec.

---

## Table of Contents

1. [Overview](#overview)
2. [Database — `users` Table](#1-database--users-table)
3. [Backend File Structure](#2-backend-file-structure)
4. [Install Dependencies](#3-install-dependencies)
5. [Raw SQL Queries](#4-usersqueriesjs--raw-sql)
6. [Auth Controller](#5-authcontrollerjs)
7. [Auth Middleware](#6-authmiddlewarejs--jwt-guard--role-guard)
8. [Auth Routes](#7-authroutesjs)
9. [Wire Into server.js](#8-wire-it-into-serverjs)
10. [Frontend Route Guards](#9-frontend--route-guards-react)
11. [Key Decisions Summary](#10-key-decisions)
12. [Full Auth Flow](#summary-of-the-full-flow)

---

## Overview

The auth system uses **stateless JWT tokens** stored in `httpOnly` cookies. Three roles exist:

| Role | Surface | Auth Required |
|---|---|---|
| `admin` | `/admin` | Yes — JWT + role check |
| `employee` | `/pos` | Yes — JWT + role check |
| Kitchen Staff | `/kds` | **No** — open URL by design |

---

## 1. Database — `users` Table

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Backend File Structure

Under `/server`, create these files:

```
/server
  /routes
    auth.routes.js
  /controllers
    auth.controller.js
  /middleware
    auth.middleware.js
  /db
    users.queries.js
```

---

## 3. Install Dependencies

```bash
npm install bcrypt jsonwebtoken cookie-parser
```

---

## 4. `users.queries.js` — Raw SQL

```js
// server/db/users.queries.js
const db = require('./index'); // your pg/postgres.js client

const findUserByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );
  return result.rows[0];
};

const createUser = async ({ name, email, passwordHash, role }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
};

module.exports = { findUserByEmail, createUser };
```

---

## 5. `auth.controller.js`

```js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../db/users.queries');

const JWT_SECRET = process.env.JWT_SECRET; // store in .env

// POST /api/v1/auth/signup
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!['admin', 'employee'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, passwordHash, role });

  res.status(201).json({ message: 'Account created', user });
};

// POST /api/v1/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }  // one shift
  );

  // httpOnly cookie (recommended)
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000
  });

  res.json({ role: user.role, name: user.name });
};

// POST /api/v1/auth/logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

module.exports = { signup, login, logout };
```

---

## 6. `auth.middleware.js` — JWT Guard + Role Guard

```js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Verifies JWT from cookie or Authorization header
const authenticate = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Usage: requireRole('admin') or requireRole('employee')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { authenticate, requireRole };
```

---

## 7. `auth.routes.js`

```js
const router = require('express').Router();
const { signup, login, logout } = require('../controllers/auth.controller');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
```

---

## 8. Wire It Into `server.js`

```js
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const { authenticate, requireRole } = require('./middleware/auth.middleware');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected routes — apply middleware per router
// Admin-only
app.use('/api/v1/products', authenticate, requireRole('admin'), productRoutes);
// Employee-only
app.use('/api/v1/orders', authenticate, requireRole('employee'), orderRoutes);
// Any authenticated user
app.use('/api/v1/sessions', authenticate, sessionRoutes);
```

---

## 9. Frontend — Route Guards (React)

```jsx
// client/shared/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth(); // reads JWT payload from context/localStorage
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/unauthorized" />;
  return children;
};
```

```jsx
// In your router setup
<Route path="/admin/*" element={
  <ProtectedRoute requiredRole="admin"><AdminApp /></ProtectedRoute>
} />
<Route path="/pos/*" element={
  <ProtectedRoute requiredRole="employee"><POSApp /></ProtectedRoute>
} />
<Route path="/kds" element={<KDS />} /> {/* open — no auth */}
```

After login, redirect based on role:

```js
// In login handler after API call succeeds
if (role === 'admin') navigate('/admin');
else if (role === 'employee') navigate('/pos');
```

---

## 10. Key Decisions

| Decision | What it means |
|---|---|
| **JWT, stateless** | No session table needed; token carries `userId`, `role`, `name` |
| **httpOnly cookie** | More secure than localStorage; immune to XSS |
| **bcrypt cost 12** | Secure enough, fast enough for a demo/hackathon |
| **8h token expiry** | Matches a typical café shift |
| **KDS has no auth** | `/kds` route is left completely open — by design |
| **`is_active` flag** | Archived employees can't log in — filtered at the query level |

---

## Summary of the Full Flow

```
POST /auth/login
  → validate email + password
  → bcrypt.compare()
  → sign JWT { userId, role, name }
  → set httpOnly cookie
  → return { role, name }

Frontend reads role → redirects to /admin or /pos

Every subsequent API call:
  → cookie sent automatically
  → authenticate middleware verifies JWT
  → requireRole middleware checks role
  → controller runs
```

---

> **Note:** The `users.queries.js` file is also where you'll add `updatePassword` and `deactivateUser` queries when building the Employee Management feature in the Admin panel.
