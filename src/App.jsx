import React from 'react';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { CurrentOrderProvider } from './contexts/CurrentOrderContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Componentes de autenticación
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/shared/ProtectedRoute';
import MessageDisplay from './components/auth/MessageDisplay';

// Componentes para mozos
import MenuPage from './components/mozos/MenuPage';
import OrderHistoryPage from './components/mozos/OrderHistoryPage';

// Componentes para admin
import Dashboard from './components/admin/Dashboard';
import DashboardSection from './components/admin/sections/DashboardSection';
import PresupuestosSection from './components/admin/sections/PresupuestosSection';
import GastosSection from './components/admin/sections/GastosSection';
import ProductosSection from './components/admin/sections/ProductosSection';
import ReporteDiaSection from './components/admin/sections/ReporteDiaSection';
import AtencionClientesSection from './components/admin/sections/AtencionClientesSection';

// Componentes compartidos
import Header from './components/shared/Header';
import Sidebar from './components/shared/Sidebar';
import RealtimeNotifier from './components/shared/RealtimeNotifier';
import AppLayout from './components/shared/AppLayout';

// Componente de carga
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 text-lg">Cargando...</p>
    </div>
  </div>
);

function App() {
  const {
      user,
      userRole,
      loading,
      login,
      logout,
      isAuthenticated,
      hasRole,
      hasAnyRole,
      isAdmin,
      isMozo
  } = useAuth();
  console.log('APP: Renderizando. loading:', loading, '| isAuthenticated:', isAuthenticated);
  // Mostrar loading mientras se inicializa la autenticación
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si el usuario NO está autenticado, renderizamos un router simple SOLO para el login
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          {/* Cualquier otra ruta redirige a /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Si el usuario SÍ está autenticado, renderizamos el router de la aplicación principal
  return (
    <DataCacheProvider>
      <CurrentOrderProvider >
        <Router>
          <Routes>
            {/* Las rutas autenticadas viven dentro del Layout */}
            <Route path="/" element={<AppLayout />}>

              {/* GRUPO 1: Rutas para Mozos (y Admins) */}
              <Route element={<ProtectedRoute allowedRoles={['mozo', 'admin', 'cajero']} />}>
                <Route path="menu" element={<MenuPage />} />
                <Route path="historial-pedidos" element={<OrderHistoryPage />} />
              </Route>

              {/* GRUPO 2: Rutas para Cajeros y Admins) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'cajero']} />}>
                <Route path="gastos" element={<GastosSection />} />
                <Route path="reporte-dia" element={<ReporteDiaSection />} />
                <Route path="productos" element={<ProductosSection />} />
                <Route path="atencion-clientes" element={<AtencionClientesSection />} />
              </Route>

              {/* GRUPO 3: Rutas solo para Admins */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="dashboard-section" element={<DashboardSection />} />
                <Route path="presupuestos" element={<PresupuestosSection />} />
                
              </Route>
              
              {/* Redirección principal cuando entras a la app */}
              <Route 
                index 
                element={<Navigate to={isAdmin ? '/dashboard-section' : '/menu'} replace />} 
              />
            </Route>

            {/* Cualquier otra ruta no encontrada te lleva a la página principal */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

        </Router>
      </CurrentOrderProvider>
    </DataCacheProvider>
  );
}

export default App;