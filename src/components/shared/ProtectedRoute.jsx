import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  userRole, 
  isAuthenticated, 
  redirectTo = "/" 
}) => {
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay roles específicos requeridos, permitir acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Si el usuario no tiene el rol requerido, redirigir
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;