import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, userRole, mozoName, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await onLogout();
    if (!result.success) {
      console.error('Error al cerrar sesión:', result.error);
    }
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrador';
      case 'mozo':
        return 'Mozo';
      default:
        return 'Usuario';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Información del usuario */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {userRole === 'admin' ? '👑' : '👤'}
              </span>
            </div>
            
            {/* Información del usuario */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {getGreeting()}, {mozoName || user?.username}
              </h2>
              <p className="text-sm text-gray-600">
                {getRoleDisplayName()}
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional y acciones */}
        <div className="flex items-center space-x-4">
          {/* Botones móviles para mozos */}
          {(userRole === 'mozo' || userRole === 'admin') && (
            <div className="flex items-center space-x-2 lg:hidden">
              <button
                onClick={() => navigate('/historial-pedidos')}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-colors"
                title="Historial de Pedidos"
              >
                📋
              </button>
            </div>
          )}

          {/* Fecha y hora actual */}
          <div className="hidden md:block text-right">
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-PE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:block">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;