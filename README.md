# La Casita — Restaurant Management System

A full-stack web application for managing the daily operations of a restaurant: orders, inventory, expenses, budgets, daily reports, customer service and thermal-printer ticketing. Built for **La Casita** (Huánuco, Perú).

> **Stack:** React 18 · Vite · Tailwind CSS · React Router v7 · Supabase (PostgreSQL + Auth + Realtime) · Vercel

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [License](#license)

---

## Features

- **Role-based access control** with three user types: `admin`, `cajero` (cashier) and `mozo` (waiter).
- **Real-time order tracking** and live stock updates powered by Supabase Realtime.
- **Thermal printing** for customer receipts and kitchen tickets (58 mm format) via `react-to-print`.
- **Expense and budget management** with category breakdowns and daily reports.
- **Interactive dashboard** with charts and KPIs for administrators.
- **Customer-service messaging** for live communication between staff and tables.
- **Mobile-friendly waiter UI** with a collapsible menu and floating cart.
- **Per-dish customization** (notes, modifiers, options).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router DOM v7 |
| Styling | Tailwind CSS, PostCSS, Autoprefixer |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime) |
| Printing | `react-to-print` |
| Analytics | Vercel Analytics |
| Linting | ESLint |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- A **Supabase** project (URL and anon key)

### Installation

```bash
git clone <repository-url>
cd la-casita
npm install
```

Then create your `.env.local` file (see [Environment Variables](#environment-variables)) and run:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Builds the application for production |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint across the project |

---

## Environment Variables

Create a `.env.local` file at the root of the project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_public_key
```

> Never commit `.env*` files. They are already ignored in `.gitignore`.

---

## Database Setup

The app expects the following Supabase tables:

| Table | Purpose |
|---|---|
| `usuarios` | User accounts and roles |
| `productos` | Product catalog |
| `categorias` / `categoria_menu` | Product and menu categories |
| `pedidos` | Orders |
| `pedido_items` | Order line items |
| `gastos` | Expenses |
| `presupuestos` | Budgets |
| `mozos` | Waiter information |

A migration script for the menu-category table is included at the repo root:

```bash
create_categoria_menu_table.sql
```

Run it from the **Supabase SQL Editor**. Make sure Row Level Security policies are configured for your roles.

---

## Project Structure

```
la-casita/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── admin/              # Dashboard, forms, charts, sections
│   │   ├── auth/               # Login + auth messages
│   │   ├── mozos/              # Waiter views: menu, orders, mobile cart
│   │   └── shared/             # Layout, navigation, printing, realtime
│   ├── contexts/               # Auth, CurrentOrder, DataCache
│   ├── hooks/                  # Custom hooks (useAuth, useDashboard, ...)
│   ├── services/               # Supabase client and API modules
│   ├── App.jsx                 # Routing + role-based protection
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind base styles
├── create_categoria_menu_table.sql
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── eslint.config.js
├── vercel.json
└── package.json
```

---

## Architecture Overview

### Authentication & Authorization

Authentication is handled through [`AuthContext`](src/contexts/AuthContext.jsx). Routes are wrapped in [`ProtectedRoute`](src/components/shared/ProtectedRoute.jsx) which validates the user's role before rendering. Unauthorized access is redirected to login.

### Routes

| Path | Roles allowed |
|---|---|
| `/menu` | mozo, admin |
| `/historial-pedidos` | mozo, admin, cajero |
| `/gastos` | admin, cajero |
| `/productos` | admin, cajero |
| `/reporte-dia` | admin, cajero |
| `/atencion-clientes` | admin, cajero |
| `/dashboard-section` | admin |
| `/presupuestos` | admin |

### State Management

- [`AuthContext`](src/contexts/AuthContext.jsx) — current user and role.
- [`DataCacheContext`](src/contexts/DataCacheContext.jsx) — cached products, categories, and reference data.
- [`CurrentOrderContext`](src/contexts/CurrentOrderContext.jsx) — in-progress order shared across menu and cart.

### Realtime

Supabase channels keep stock levels, orders and customer-service messages in sync across clients. Subscriptions are encapsulated inside dedicated hooks ([`useMessages`](src/hooks/useMessages.js), [`useOrderHistory`](src/hooks/useOrderHistory.js), etc.).

### Printing

[`BoletaTermica`](src/components/shared/BoletaTermica.jsx) renders the customer receipt and [`Comanda`](src/components/shared/Comanda.jsx) renders the kitchen ticket. Both are formatted for **58 mm thermal printers** and triggered through [`usePrint`](src/hooks/usePrint.js) on top of `react-to-print`.

---

## Deployment

The project is configured for **Vercel** through [`vercel.json`](vercel.json). Steps:

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project on Vercel.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` environment variables.
4. Deploy.

---

## License

This project is released under the **MIT License**.

---

> Built with ❤ for La Casita — Huánuco, Perú.
