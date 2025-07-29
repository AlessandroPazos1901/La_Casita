import React from 'react';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { CurrentOrderProvider } from './contexts/CurrentOrderContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

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

// Componentes compartidos
import Header from './components/shared/Header';
import Sidebar from './components/shared/Sidebar';

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
      mozoData,
      loading,
      initialized,
      login,
      logout,
      isAuthenticated,
      hasRole,
      hasAnyRole,
      isAdmin,
      isMozo,
      username,
      mozoName
  } = useAuth();

  // Mostrar loading mientras se inicializa la autenticación
  if (loading || !initialized) {
    return <LoadingSpinner />;
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated()) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LoginPage onLogin={login} />} />
        </Routes>
      </Router>
    );
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <DataCacheProvider>
      <CurrentOrderProvider mozoData={mozoData} userRole={userRole}>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              {/* Rutas para mozos */}
              <Route
                path="/menu"
                element={
                  <ProtectedRoute 
                    allowedRoles={['mozo', 'admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-hidden">
                          <MenuPage 
                            mozoData={mozoData} 
                            userRole={userRole}
                          />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/historial-pedidos"
                element={
                  <ProtectedRoute 
                    allowedRoles={['mozo', 'admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <OrderHistoryPage 
                            mozoData={mozoData} 
                            userRole={userRole}
                          />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Rutas para admin */}
              <Route
                path="/dashboard-section"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <DashboardSection />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/presupuestos"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <PresupuestosSection />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/gastos"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <GastosSection />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reporte-dia"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <ReporteDiaSection />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/productos"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <ProductosSection />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-historial"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                          <OrderHistoryPage 
                            mozoData={mozoData} 
                            userRole={userRole}
                          />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-menu"
                element={
                  <ProtectedRoute 
                    allowedRoles={['admin']}
                    userRole={userRole}
                    isAuthenticated={isAuthenticated()}
                  >
                    <div className="flex h-screen bg-gray-100">
                      <Sidebar userRole={userRole} />
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                          user={user} 
                          userRole={userRole} 
                          mozoName={mozoName}
                          onLogout={logout}
                        />
                        <main className="flex-1 overflow-hidden">
                          <MenuPage 
                            mozoData={mozoData} 
                            userRole={userRole}
                          />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              {/* Ruta por defecto */}
              <Route
                path="/"
                element={
                  <Navigate 
                    to={isAdmin ? '/dashboard-section' : '/menu'} 
                    replace 
                  />
                }
              />

              {/* Ruta 404 */}
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </div>
        </Router>
      </CurrentOrderProvider>
    </DataCacheProvider>
  );
}

export default App;