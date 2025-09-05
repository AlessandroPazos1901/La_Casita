import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({  userRole, isSidebarOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = {
    mozo: [
      { 
        path: '/menu', 
        label: 'Tomar Pedidos', 
        icon: '🍽️',
        description: 'Crear nuevos pedidos'
      },
      { 
        path: '/historial-pedidos', 
        label: 'Historial de Pedidos', 
        icon: '📋',
        description: 'Ver pedidos realizados'
      }
    ],
    cajero: [ 
      { 
        path: '/menu',  
        label: 'Tomar Pedidos', 
        icon: '🍽️',
        description: 'Crear nuevos pedidos'
      },
      { 
        path: '/historial-pedidos',  
        label: 'Historial de Pedidos', 
        icon: '📋',
        description: 'Ver todos los pedidos'
      },
      { separator: true, category: 'Gestión' },
      { 
        path: '/gastos', 
        label: 'Gastos', 
        icon: '💸',
        description: 'Registro de gastos'
      },
      { 
        path: '/reporte-dia', 
        label: 'Reporte del Día', 
        icon: '📋',
        description: 'Reporte diario'
      },
      { 
        path: '/productos', 
        label: 'Productos',
        description: 'Gestionar el menú',
        icon: '📦' 
      },
      { 
        path: '/atencion-clientes', 
        label: 'Atención Cliente', 
        description: 'Chats de WhatsApp',
        icon: '💬' 
      },
    ],
    admin: [
      { 
        path: '/dashboard-section',  
        label: 'Análisis', 
        icon: '📈',
        description: 'Métricas detalladas'
      },
      { 
        path: '/presupuestos', 
        label: 'Presupuestos', 
        icon: '💼',
        description: 'Gestión de presupuestos'
      },
      { 
        path: '/gastos', 
        label: 'Gastos', 
        icon: '💸',
        description: 'Registro de gastos'
      },
      { 
        path: '/reporte-dia', 
        label: 'Reporte del Día', 
        icon: '📋',
        description: 'Reporte diario'
      },
      { 
        path: '/productos', 
        label: 'Productos',
        description: 'Gestionar el menú',
        icon: '📦' 
      },
      // Separador
      { separator: true, category: 'Operaciones' },
      // Acceso a funciones de mozo CON SIDEBAR
      { 
        path: '/menu',  
        label: 'Tomar Pedidos', 
        icon: '🍽️',
        description: 'Crear nuevos pedidos'
      },
      { 
        path: '/historial-pedidos',  
        label: 'Historial de Pedidos', 
        icon: '📋',
        description: 'Ver pedidos realizados'
      },
      // Añade el nuevo objeto al array del menú del admin
      { path: '/atencion-clientes', 
        label: 'Atención Cliente', 
        description: 'Chats de WhatsApp',
        icon: '💬' },
    ]
  };

  const currentMenu = menuItems[userRole] || [];

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

  // 2. Clases dinámicas para controlar la visibilidad
  const sidebarClasses = `
    bg-gray-800 text-white w-64 min-h-screen flex flex-col
    fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
    lg:relative lg:translate-x-0 lg:z-auto
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* 2. Este es el overlay que aparece en móviles cuando el menú está abierto */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}

      {/* 3. Aquí empieza tu código, pero usamos `sidebarClasses` en el div principal */}
      <div className={sidebarClasses}>
        {/* Logo y rol (tu código original sin cambios) */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">La Casita</h1>
              <p className="text-gray-400 text-sm">{getRoleDisplayName()}</p>
            </div>
          </div>
        </div>

        {/* Navigation (tu código original sin cambios) */}
        <nav className="flex-1 mt-6">
          <ul className="space-y-1">
            {currentMenu.map((item, index) => {
              if (item.separator) {
              return (
                <li key={`separator-${index}`} className="px-6 py-3">
                  <hr className="border-gray-600" />
                  {item.category && (
                    <p className="text-gray-400 text-xs font-semibold mt-3 mb-1">
                      {item.category}
                    </p>
                  )}
                </li>
              );
            }

            // Renderizar item de menú
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                    isActive(item.path) 
                      ? 'bg-gray-700 text-white border-r-4 border-blue-500' 
                      : ''
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer del sidebar */}
      <div className="p-6 border-t border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">
            Sistema de Gestión
          </div>
          <div className="text-xs text-gray-400">
            © 2025 Alsheep AI
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;