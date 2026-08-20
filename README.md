# OlioCMS Frontend

A modern, high-performance Headless Content Management System (CMS) frontend built with **Next.js (App Router)**, **TypeScript**, and **TailwindCSS**.

---

## 🚀 Features

- 🔐 **Authentication & Authorization**: Integrated with FastAPI & Supabase Auth (`/login` & `/register`).
- 🏢 **Multi-Tenant Architecture**: Automatic storage and forwarding of `X-Tenant-Id` and `Authorization: Bearer <jwt_token>` for strict tenant isolation.
- 📦 **Content Management Dashboard**: Complete management of Products, Categories, Brands, Tags, and Media assets.
- 🎨 **Dynamic Theme System**: Dark Mode and Light Mode support with glassmorphism UI aesthetics.
- 🔔 **Interactive Toast System**: Instant visual feedback for API actions, login statuses, and form validations.

---

## 🛠️ Project Structure

```
oliocms_frontend/
├── public/                # Static assets and brand logos
├── src/
│   ├── api/               # API clients (auth, products, categories, etc.)
│   ├── app/               # Next.js App Router pages (login, register, dashboard, etc.)
│   ├── components/        # Reusable UI components (auth, layout, common)
│   ├── config/            # Application configuration (app.config.ts)
│   ├── models/            # TypeScript interfaces & domain models
│   └── state/             # Global React Context & state hooks (OlioProvider.tsx, useAuthStore.ts)
├── .env.example           # Environment variables template
├── .env.local             # Local environment configuration (ignored by git)
└── next.config.mjs        # Next.js configuration
```

---

## ⚡ Getting Started

### 1. Prerequisites

- **Node.js**: v18.x or higher
- **npm** / **yarn** / **pnpm**
- **OlioCMS Backend**: Running FastAPI server (`http://localhost:8000`)

---

### 2. Environment Configuration

Create a `.env.local` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Define your backend API URL in `.env.local`:

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### 3. Installation

Install project dependencies:

```bash
npm install
```

---

### 4. Running the Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Production Build

To build the application for production:

```bash
npm run build
npm start
```

---

## 🔒 Authentication & Multi-Tenant API Requests

All authenticated API requests automatically attach the required security headers using `getAuthHeaders()` from `src/api/auth.api.ts`:

```typescript
import { getAuthHeaders } from "@/api/auth.api";

// Example authenticated API call
const res = await fetch("http://localhost:8000/api/v1/products", {
  headers: getAuthHeaders(),
});
```

Headers forwarded automatically:
- `Authorization: Bearer <supabase_access_token>`
- `X-Tenant-Id: <tenant_id>`
