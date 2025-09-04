// src/contexts/AuthContext.jsx

{/*El Patrón de Proveedor de Contexto
   envolverá toda tu aplicación, asegurando que cada componente que necesite saber
    si el usuario está logueado consulte la misma y única fuente de verdad. Cuando el estado cambie en un lugar, todos se enterarán al instante  
    LE DECIMOS AL APP QUE USE ESTE PROVEEDOR EN MAIN.jsx*/}
import React, { createContext, useContext } from 'react';
import useAuthHook from '../hooks/useAuth'; // Importamos el hook que ya tenemos

// 1. Creamos el Contexto
const AuthContext = createContext(null);

// 2. Creamos el Componente Proveedor
export const AuthProvider = ({ children }) => {
  // Nuestro hook `useAuth` se llama UNA SOLA VEZ aquí
  const auth = useAuthHook();

  // El proveedor comparte el valor de `auth` a todos sus hijos
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Creamos un hook personalizado para consumir el contexto fácilmente
// Los componentes llamarán a este `useAuth` en lugar del archivo del hook directamente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};