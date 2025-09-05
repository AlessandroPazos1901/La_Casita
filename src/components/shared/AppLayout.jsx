// src/components/shared/AppLayout.jsx
// patrón moderno de react-router-dom llamado "Layout Routes".
//crear un componente principal de "diseño" (Layout) que contenga los elementos comunes 
//(Sidebar, Header) y un espacio para el contenido de la página, que será manejado por el router.

import React from 'react';
import { Outlet} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import RealtimeNotifier from './RealtimeNotifier';

const AppLayout = () => {

  const { user, userRole, mozoName, logout, isAdmin,hasManagementAccess, userName } = useAuth();

  return (
    <>
      <RealtimeNotifier />
      <div className="flex h-screen bg-gray-100">
        {/* El Sidebar solo se muestra si el usuario es admin */}
        {hasManagementAccess && <Sidebar userRole={userRole} />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            user={user} 
            userRole={userRole} 
            mozoName={mozoName}
            onLogout={logout}
            userName={userName}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 md:p-6">
            {/* Outlet renderizará el componente de la ruta hija (ej: Dashboard, MenuPage) */}
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AppLayout;