# Documentación de Hooks Personalizados

---

## useAuth

Maneja la autenticación y el perfil del usuario.

**Estado expuesto:**
- `user`: Usuario autenticado.
- `profile`: Perfil del usuario (nombre, rol, etc).
- `userRole`: Rol del usuario (`admin`, `mozo`, `cajero`).
- `loading`: Estado de carga.
- `isAuthenticated`: Si hay usuario autenticado.
- `isAdmin`, `isMozo`, `isCajero`: Flags por rol.
- `userName`: Nombre del usuario.
- `hasManagementAccess`: Si el usuario tiene acceso administrativo.

**Funciones:**
- `login(username, password)`: Inicia sesión.
- `logout()`: Cierra sesión.

**Uso:**
```js
const { user, profile, login, logout, isAuthenticated, userRole } = useAuth();
```

---

## useDashboard

Gestiona productos, categorías, gastos, presupuestos y cuentas pendientes, usando caché global.

**Estado expuesto:**
- `ventas`, `gastos`, `categorias`, `presupuestos`, `cuentasPendientes`, `productos`, `pedidos`, `estadisticas`
- `loading`, `error`

**Funciones:**
- Productos: `addProduct`, `updateProduct`, `deleteProduct`
- Categorías: `addCategoria`, `updateCategoria`, `deleteCategoria`, `checkCategoriaUsage`, `moveCategoriaData`
- Gastos: `addGasto`, `updateGasto`, `deleteGasto`
- Cuentas pendientes: `addCuentaPendiente`, `deleteCuentaPendiente`
- Presupuestos: `addPresupuesto`, `updatePresupuesto`, `deletePresupuesto`
- Utilidad: `getVentasByDateRange`, `getGastosByDateRange`, `refreshData`

**Uso:**
```js
const { gastos, addGasto, categorias, addCategoria, estadisticas } = useDashboard();
```

---

## useOrderHistory

Obtiene y gestiona el historial de pedidos, con actualizaciones en tiempo real.

**Estado expuesto:**
- `ordersHistory`: Lista de pedidos.
- `loading`, `error`
- `stats`: Estadísticas de pedidos.

**Funciones:**
- CRUD: `createOrder`, `insertOrderItems`, `markOrderAsPaid`, `updateOrder`, `deleteOrder`, `getOrderItems`, `deleteOrderItems`
- Utilidad: `refreshOrderHistory`, `getPendingOrders`, `getPaidOrders`, `getOrdersByDate`, `getOrderById`, `getTotalSales`, `getTotalSalesByDate`, `getOrdersStats`

**Uso:**
```js
const { ordersHistory, createOrder, markOrderAsPaid, stats } = useOrderHistory(userId, userRole);
```

---

## useMenuItems

Gestiona los productos del menú y su stock, agrupados por categoría.

**Estado expuesto:**
- `menuItems`: Productos organizados por categoría.
- `loading`, `error`
- `totalProducts`, `availableProducts`, `categories`

**Funciones:**
- Stock: `decrementStock`, `incrementStock`, `adjustStock`
- Búsqueda: `getProductById`, `getProductsByCategory`, `getAllProducts`, `getAvailableProducts`
- Utilidad: `refreshMenu`, `updateLocalStock`

**Uso:**
```js
const { menuItems, decrementStock, getProductById, refreshMenu } = useMenuItems();
```

---

## usePrint

Permite imprimir pedidos y realizar pruebas de impresión con un servidor local.

**Estado expuesto:**
- `isLoading`, `error`

**Funciones:**
- `printOrder(order, changes)`: Envía un pedido a imprimir.
- `testPrint()`: Realiza una prueba de impresión.
- `checkServerStatus()`: Verifica si el servidor de impresión está disponible.

**Uso:**
```js
const { printOrder, testPrint, isLoading, error } = usePrint();
```

---

## useCurrentOrder

Accede al contexto del pedido actual.

**Uso:**
```js
const currentOrder = useCurrentOrder();
```
> Debe usarse dentro de un `CurrentOrderProvider`.

---

## useMessages

Gestiona mensajes de éxito, error, información y advertencia en la interfaz, con auto-ocultado.

**Estado expuesto:**
- `message`: Texto del mensaje actual.
- `messageType`: Tipo de mensaje (`success`, `error`, `info`, `warning`).
- `hasMessage`: Indica si hay mensaje visible.

**Funciones:**
- `showMessage(text, type, duration)`: Muestra un mensaje personalizado.
- `showSuccess(text, duration)`: Muestra un mensaje de éxito.
- `showError(text, duration)`: Muestra un mensaje de error.
- `showInfo(text, duration)`: Muestra un mensaje informativo.
- `showWarning(text, duration)`: Muestra un mensaje de advertencia.
- `hideMessage()`: Oculta el mensaje actual.
- `clearMessage()`: Alias para ocultar el mensaje.

**Uso:**
```js
const { showSuccess, showError, message, messageType, hideMessage } = useMessages();

showSuccess('Operación exitosa');
showError('Ocurrió un error');
```