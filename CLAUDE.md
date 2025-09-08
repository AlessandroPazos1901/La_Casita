# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "La Casita" restaurant management system - a React/Vite web application for managing orders, expenses, budgets, and customer service. Built with Supabase as backend, Tailwind CSS for styling, and React Router for navigation.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Printing**: react-to-print

### Authentication & Authorization
The app uses role-based authentication with three user types:
- `admin`: Full access to all features
- `cajero`: Access to products, expenses, reports, customer service
- `mozo`: Access to menu and order history only

Authentication is handled through `AuthContext` (`src/contexts/AuthContext.jsx`) and protected routes use `ProtectedRoute` component.

### Main Application Structure

**Entry Point**: `src/App.jsx` - Contains the main routing logic with role-based route protection

**Core Contexts**:
- `AuthContext`: User authentication and role management
- `DataCacheContext`: Global data caching for products, categories, etc.
- `CurrentOrderContext`: Current order state management

**Route Structure**:
- `/menu` - Menu page for mozos and admins
- `/historial-pedidos` - Order history (mozo/admin/cajero)
- `/gastos` - Expenses management (admin/cajero)
- `/productos` - Product management (admin/cajero)
- `/reporte-dia` - Daily reports (admin/cajero)
- `/atencion-clientes` - Customer service (admin/cajero)
- `/dashboard-section` - Main dashboard (admin only)
- `/presupuestos` - Budget management (admin only)

### Key Services

**Supabase Client** (`src/services/supabaseClient.js`):
- Centralized Supabase configuration and API functions
- Organized into modules: `auth`, `products`, `orders`, `gastos`, `presupuestos`
- Real-time subscriptions for stock changes
- Database functions for stock management

### Component Organization

**Admin Components** (`src/components/admin/`):
- `Dashboard.jsx` - Main admin interface
- `sections/` - Different admin sections (dashboard, expenses, budgets, etc.)
- `forms/` - Form components for data entry
- `charts/` - Chart components for data visualization

**Mozo Components** (`src/components/mozos/`):
- `MenuPage.jsx` - Product menu interface
- `OrderHistoryPage.jsx` - Order history display
- `CustomizeDishModal.jsx` - Dish customization
- `MobileCart.jsx` - Mobile cart interface

**Shared Components** (`src/components/shared/`):
- `AppLayout.jsx` - Main layout wrapper
- `Header.jsx` & `Sidebar.jsx` - Navigation components
- `RealtimeNotifier.jsx` - Real-time notifications
- `BoletaTermica.jsx` - Thermal receipt printing
- `Comanda.jsx` - Kitchen order printing

### Custom Hooks

**Key Hooks** (`src/hooks/`):
- `useAuth.js` - Authentication state management
- `useDashboard.js` - Dashboard data and operations
- `useMenuItems.js` - Menu and product data
- `useOrderHistory.js` - Order history management
- `useCurrentOrder.js` - Current order state
- `useMessages.js` - Real-time messaging
- `usePrint.js` - Printing functionality

### Database Integration

The app uses Supabase with these main tables:
- `usuarios` - User accounts and roles
- `productos` - Product catalog
- `categorias` - Product categories  
- `pedidos` - Orders
- `pedido_items` - Order line items
- `gastos` - Expenses
- `presupuestos` - Budgets
- `mozos` - Waitstaff information

### Environment Configuration

Required environment variables in `.env.local`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_KEY` - Supabase anon/public key

### Real-time Features

The application includes real-time functionality:
- Stock level updates using Supabase subscriptions
- Customer service messaging
- Order status notifications
- Live dashboard updates

### Printing System

Thermal printing is handled through `react-to-print` with custom components:
- `BoletaTermica.jsx` - Customer receipts
- `Comanda.jsx` - Kitchen orders

Both components format data for 58mm thermal printers with proper styling and spacing.