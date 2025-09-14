import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuType } from '../../contexts/MenuTypeContext';
const Header = ({ user, userRole, mozoName, onLogout, userName, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { menuType } = useMenuType();

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrador';
      case 'mozo':
        return 'Mozo(a)';
      case 'cajero':
       return 'Cajero(a)';
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
          {/* Será visible solo en pantallas pequeñas (lg:hidden) */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
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
                {getGreeting()}, {userName}
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
          {(userRole === 'mozo') && (
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

          {/* Indicador de tipo de menú */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-2">
            <span className="text-xl" title={menuType === 'day' ? 'Carta del Día' : 'Carta de la Noche'}>
              {menuType === 'day' ? '☀️' : '🌙'}
            </span>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {menuType === 'day' ? 'Día' : 'Noche'}
            </span>
          </div>

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
            onClick={onLogout}
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