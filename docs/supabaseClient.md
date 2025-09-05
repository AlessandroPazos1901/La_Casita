# Supabase Client (`src/services/supabaseClient.js`)

Este archivo centraliza la configuración y las funciones auxiliares para interactuar con la base de datos Supabase en el proyecto La Casita.

---

## Configuración

- **Cliente principal:**  
  ```js
  export const supabase = createClient(supabaseUrl, supabaseKey);
  ```
  Utiliza las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`.

---

## Autenticación (`auth`)

Funciones para gestionar usuarios y sesiones:

- **signIn(email, password):** Inicia sesión con correo y contraseña.
- **signUp(email, password, metadata):** Registra un nuevo usuario con datos adicionales.
- **signOut():** Cierra la sesión actual.
- **getCurrentUser():** Obtiene el usuario autenticado actual.
- **getUserProfile(user):** Obtiene el perfil del usuario desde la tabla `usuarios`.
- **getCurrentSession():** Obtiene la sesión actual.
- **isAuthenticated():** Verifica si hay sesión válida.
- **getMozoData(profile):** Obtiene datos del mozo si el usuario tiene rol `mozo`.

---

## Roles de usuario (`userRoles`)

- **determineRole(user):** Devuelve el rol del usuario autenticado.
- **getMozoData(user):** Obtiene datos del mozo desde la tabla `mozos` si el usuario tiene ese rol.

---

## Productos y Stock (`products`)

- **getActiveProducts():** Obtiene todos los productos activos.
- **decrementStock(productId, quantity):** Disminuye el stock de un producto.
- **incrementStock(productId, quantity):** Aumenta el stock de un producto.
- **adjustStock(productId, adjustment):** Ajusta el stock (positivo o negativo).
- **subscribeToStockChanges(callback):** Suscribe a cambios en el stock en tiempo real.

---

## Pedidos (`orders`)

- **createOrder(orderData):** Crea un nuevo pedido.
- **insertOrderItems(items):** Inserta los ítems de un pedido.
- **getOrderHistory(mozoId):** Obtiene el historial de pedidos de un mozo.
- **markOrderAsPaid(orderId):** Marca un pedido como pagado.
- **updateOrder(orderId, updates):** Actualiza los datos de un pedido.
- **getOrderItems(orderId):** Obtiene los ítems de un pedido.
- **deleteOrderItems(orderId):** Elimina los ítems de un pedido.

---

## Gastos (`gastos`)

- **getAll():** Obtiene todos los gastos.
- **create(gastoData):** Crea un nuevo gasto.
- **update(id, gastoData):** Actualiza un gasto existente.
- **delete(id):** Elimina un gasto.

---

## Presupuestos (`presupuestos`)

- **getAll():** Obtiene todos los presupuestos.
- **create(presupuestoData):** Crea un nuevo presupuesto.
- **update(id, presupuestoData):** Actualiza un presupuesto existente.

---

## Ejemplo de uso

```js
import { supabase, auth, products, orders, gastos, presupuestos } from '../services/supabaseClient';

// Autenticación
const { user, error } = await auth.signIn(email, password);

// Productos
const { data: productos } = await products.getActiveProducts();

// Pedidos
const { data: pedido } = await orders.createOrder(orderData);

// Gastos
const { data: gastosList } = await gastos.getAll();
```

---

> Todas las funciones devuelven `{ data, error }` o `{ error }` para facilitar el manejo de respuestas y errores.