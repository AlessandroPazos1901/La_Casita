# Documentación de Contextos Personalizados

---

## AuthContext

Provee el estado y funciones de autenticación a toda la aplicación.

**Uso:**
- Envuelve tu aplicación con `<AuthProvider>`.
- Accede al contexto con el hook `useAuth()`.

**Estado y funciones disponibles:**
- `user`, `profile`, `userRole`, `isAuthenticated`, `isAdmin`, `isMozo`, `isCajero`, `userName`, `hasManagementAccess`
- `login(username, password)`, `logout()`

**Ejemplo:**
```jsx
import { AuthProvider, useAuth } from '../contexts/AuthContext';

<AuthProvider>
  <App />
</AuthProvider>

// En cualquier componente
const { user, login, logout } = useAuth();
```

---

## DataCacheContext

Gestiona el cache global de datos (gastos, ventas, productos, pedidos, etc.) y su sincronización con la base de datos.

**Uso:**
- Envuelve tu aplicación con `<DataCacheProvider>`.
- Accede al contexto con el hook `useDataCache()`.

**Estado y funciones disponibles:**
- Datos: `gastos`, `ventas`, `categorias`, `presupuestos`, `cuentasPendientes`, `productos`, `pedidos`, `lastUpdate`
- Estados: `isLoading`, `error`
- Manipulación: `addToCache`, `updateInCache`, `removeFromCache`, `refreshCache`, `clearCache`
- Consulta especial: `getFreshDailyData(date)`

**Ejemplo:**
```jsx
import { DataCacheProvider, useDataCache } from '../contexts/DataCacheContext';

<DataCacheProvider>
  <App />
</DataCacheProvider>

// En cualquier componente
const { gastos, productos, refreshCache } = useDataCache();
```

---

## CurrentOrderContext

Gestiona el estado y las operaciones del pedido actual (carrito), incluyendo edición, envío y sincronización de stock.

**Uso:**
- Envuelve la parte de la app que gestiona pedidos con `<CurrentOrderProvider>`.
- Accede al contexto con el hook `useCurrentOrder()`.

**Estado y funciones disponibles:**
- Estado: `currentOrder`, `tableNumber`, `editingOrderId`, `originalOrderItems`, `loading`, `error`
- Operaciones: `addToOrder(item)`, `removeItemFromOrder(orderId)`, `updateOrderItem(updatedItem)`, `sendOrder()`, `loadOrderForEditing(order)`, `clearCurrentOrder()`
- Utilidad: `calcularCambiosPedido(original, nuevo)`, `totalPrice`, `totalItems`, `isEmpty`, `isEditing`, `setTableNumber()`, `setError()`, `clearOrderError()`

**Ejemplo:**
```jsx
import { CurrentOrderProvider, useCurrentOrder } from '../contexts/CurrentOrderContext';

<CurrentOrderProvider>
  <Pedidos />
</CurrentOrderProvider>

// En cualquier componente
const { currentOrder, addToOrder, sendOrder, totalPrice } = useCurrentOrder();
```

---
