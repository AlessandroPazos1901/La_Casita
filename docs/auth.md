# Componentes de Autenticación (`src/components/auth`)

---

## LoginPage.jsx

Página de inicio de sesión para usuarios del sistema.

**Características:**
- Permite ingresar usuario y contraseña.
- Muestra mensajes de error o éxito usando el componente `MessageDisplay`.
- Llama a la función `onLogin` (usualmente del contexto de autenticación).
- Redirige al usuario a la página principal si el login es exitoso.

**Props:**
- `onLogin`: Función para autenticar al usuario (debe retornar `{ success, error }`).

**Uso:**
```jsx
<LoginPage onLogin={login} />
```

---

## MessageDisplay.jsx

Componente para mostrar mensajes de estado (error o éxito) en la interfaz.

**Características:**
- Muestra un mensaje flotante en la parte superior de la pantalla.
- El color y el icono cambian según el tipo (`error` o `success`).
- Permite cerrar el mensaje manualmente.

**Props:**
- `message`: Texto del mensaje a mostrar.
- `type`: Tipo de mensaje (`error` o `success`).
- `onClose`: Función para cerrar el mensaje.

**Uso:**
```jsx
<MessageDisplay 
  message="Usuario o contraseña incorrectos" 
  type="error" 
  onClose={handleClose}
/>
```

---

