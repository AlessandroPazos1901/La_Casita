# Componentes Compartidos (`src/components/shared`)

Esta carpeta contiene componentes reutilizables y estructurales para toda la aplicación.

---

## AppLayout.jsx

Componente principal de diseño.  
Incluye el `Sidebar`, el `Header`, notificaciones en tiempo real y un espacio para el contenido de la página (usando `<Outlet />` de React Router).

**Props:**  
No recibe props directamente, usa hooks de contexto.

**Uso:**  
Envuelve las rutas principales en tu router.

---

## Sidebar.jsx

Barra lateral de navegación dinámica según el rol del usuario (`admin`, `mozo`, `cajero`).  
Muestra ítems de menú, separadores y el rol actual.

**Props:**  
- `userRole`: Rol del usuario.
- `isSidebarOpen`: Estado de visibilidad (móvil).
- `onClose`: Función para cerrar el sidebar.

---

## Header.jsx

Encabezado superior con información del usuario, saludo, fecha/hora y botón de cerrar sesión.  
Incluye botón para abrir/cerrar el sidebar en móviles.

**Props:**  
- `user`, `userRole`, `mozoName`, `onLogout`, `userName`, `onToggleSidebar`

---

## RealtimeNotifier.jsx

Muestra notificaciones en tiempo real cuando se recibe una nueva solicitud de atención al cliente (solo para admins).

**Props:**  
No recibe props directamente, usa hooks de contexto.

---

## ProtectedRoute.jsx

Protege rutas según el rol del usuario.  
Redirige si el usuario no está autenticado o no tiene permisos.

**Props:**  
- `allowedRoles`: Array de roles permitidos.

---

## BoletaTermica.jsx

Genera la boleta de venta en formato para impresión térmica.  
Recibe los datos del pedido y los muestra en formato monoespaciado.

**Props:**  
- `order`: Datos del pedido.
- `ref`: Referencia para impresión.

---

## Ejemplo de uso

```jsx
import AppLayout from './shared/AppLayout';
import ProtectedRoute from './shared/ProtectedRoute';

<Route element={<AppLayout />}>
  <Route path="/dashboard-section" element={<ProtectedRoute allowedRoles={['admin']} />} />
</Route>
```

---

> Para detalles específicos, revisa cada archivo en `src/components/shared`.