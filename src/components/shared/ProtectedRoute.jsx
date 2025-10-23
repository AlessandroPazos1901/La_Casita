// src/components/shared/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Componente de carga (puedes importarlo desde App.jsx si lo mueves a un archivo propio)
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 text-lg">Cargando...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, userRole, loading, isAdmin } = useAuth();

  // console.log('PROTECTED ROUTE: Verificando acceso. loading:', loading, '| isAuthenticated:', isAuthenticated, '| userRole:', userRole);

  // 1. Mientras se verifica la sesión, muestra una pantalla de carga.
  if (loading || (isAuthenticated && !userRole)) {
    return <LoadingSpinner />;
  }

  // // Si el usuario está autenticado pero el rol aún no se ha cargado, esperamos.
  // if (isAuthenticated && !userRole) {
  //   return <LoadingSpinner />;
  // }

  // 2. Si no está autenticado, redirige a la página de login.
  if (!isAuthenticated) {
    // `replace` evita que el usuario pueda volver atrás con el botón del navegador.
    return <Navigate to="/login" replace />;
  }

  // 3. Si está autenticado pero su rol no está permitido, redirige a una página por defecto.
  //    (Si el rol es 'mozo', lo mandamos al menú; si no, a la raíz).
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // return <Navigate to={userRole === 'mozo' ? '/menu' : '/'} replace />;
    const defaultPath = isAdmin ? '/dashboard-section' : '/menu';
    return <Navigate to={defaultPath} replace />;
  }

  // 4. Si todo está en orden (autenticado y con rol permitido), muestra el contenido de la ruta.
  //    <Outlet /> renderiza el componente hijo de la ruta.
  return <Outlet />;
};

export default ProtectedRoute;