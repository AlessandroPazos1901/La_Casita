# Sistema de Pedidos La Casita restaurant

Este proyecto es un sistema de gestión de pedidos para el restaurante La Casita Huánuco-Perú.

## Índice

- [Descripción General](#descripción-general)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Scripts Principales](#scripts-principales)
- [Componentes y Funcionalidades](#componentes-y-funcionalidades)
- [Contextos](#contextos)
- [Hooks Personalizados](#hooks-personalizados)
- [Servicios](#servicios)
- [Estilos](#estilos)
- [Despliegue](#despliegue)
- [Licencia](#licencia)

---

## Descripción General

Sistema web para la gestión de pedidos, gastos, presupuestos y atención al cliente en restaurantes. Permite la administración de productos, categorías, reportes diarios y comunicación en tiempo real con clientes.

## Estructura del Proyecto

```
Directory structure:
└── alessandropazos1901-la_casita/
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vercel.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── admin/
        │   │   ├── Dashboard.jsx
        │   │   ├── charts/
        │   │   │   └── PlatosChart.jsx
        │   │   ├── forms/
        │   │   │   ├── FormularioGasto.jsx
        │   │   │   ├── FormularioPresupuesto.jsx
        │   │   │   └── ProductoFormModal.jsx
        │   │   └── sections/
        │   │       ├── AtencionClientesSection.jsx
        │   │       ├── CategoriaManagement.jsx
        │   │       ├── DashboardSection.jsx
        │   │       ├── GastosSection.jsx
        │   │       ├── PresupuestosSection.jsx
        │   │       ├── ProductosSection.jsx
        │   │       └── ReporteDiaSection.jsx
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── MessageDisplay.jsx
        │   ├── mozos/
        │   │   ├── CollapsibleCategory.jsx
        │   │   ├── CustomizeDishModal.jsx
        │   │   ├── MenuPage.jsx
        │   │   ├── MobileCart.jsx
        │   │   └── OrderHistoryPage.jsx
        │   └── shared/
        │       ├── AppLayout.jsx
        │       ├── BoletaTermica.jsx
        │       ├── Comanda.jsx
        │       ├── Header.jsx
        │       ├── ProtectedRoute.jsx
        │       ├── RealtimeNotifier.jsx
        │       └── Sidebar.jsx
        ├── contexts/
        │   ├── AuthContext.jsx
        │   ├── CurrentOrderContext.jsx
        │   └── DataCacheContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useCurrentOrder.js
        │   ├── useDashboard.js
        │   ├── useMenuItems.js
        │   ├── useMessages.js
        │   ├── useOrderHistory.js
        │   └── usePrint.js
        └── services/
            └── supabaseClient.js

```

## Instalación

1. Clona el repositorio.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Configura las variables de entorno en `.env.local`.

## Configuración

- Tailwind CSS: Configurado en [tailwind.config.js](tailwind.config.js) y [postcss.config.js](postcss.config.js).
- Supabase: Configura las credenciales en `.env.local`.

## Scripts Principales

- `npm run dev`: Ejecuta el proyecto en modo desarrollo.
- `npm run build`: Compila el proyecto para producción.

## Componentes y Funcionalidades

- **Admin:** Gestión de productos, gastos, presupuestos, reportes y atención al cliente.
- **Mozos:** Historial de pedidos, carrito móvil, personalización de platos.
- **Shared:** Sidebar, header, notificaciones en tiempo real, boleta térmica.
- **Ejemplo:** [`AtencionClientesSection`](src/components/admin/sections/AtencionClientesSection.jsx) muestra solicitudes de clientes en tiempo real.

## Contextos

- [`AuthContext`](src/contexts/AuthContext.jsx): Manejo de autenticación.
- [`CurrentOrderContext`](src/contexts/CurrentOrderContext.jsx): Estado del pedido actual.
- [`DataCacheContext`](src/contexts/DataCacheContext.jsx): Cache de datos global.

## Hooks Personalizados

- [`useDashboard`](src/hooks/useDashboard.js): Lógica de dashboard, gastos, presupuestos, productos.
- [`useOrderHistory`](src/hooks/useOrderHistory.js): Historial de pedidos.
- [`useMessages`](src/hooks/useMessages.js): Mensajes y notificaciones.

## Servicios

- [`supabaseClient`](src/services/supabaseClient.js): Conexión y funciones para Supabase.

## Estilos

- Tailwind CSS y estilos personalizados en [`index.css`](src/index.css).

## Despliegue

- Configuración para Vercel en [`vercel.json`](vercel.json).

## Licencia

MIT

---

> Para detalles de cada componente, consulta los archivos en la carpeta [`src/components`](src/components).