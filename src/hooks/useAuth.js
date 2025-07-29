import { useState, useEffect } from 'react';
import { auth, userRoles } from '../services/supabaseClient';

const useAuth = () => {
  // const { clearCache } = useDataCache();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [mozoData, setMozoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Determinar rol
        const role = await userRoles.determineRole(currentUser);
        setUserRole(role);
        
        // Si es mozo, obtener datos del mozo
        if (role === 'mozo') {
          const mozoInfo = await userRoles.getMozoData(currentUser);
          setMozoData(mozoInfo);
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // Limpiar sesión si hay error
      await logout();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('useAuth login called with:', { username, password: '***', types: { username: typeof username, password: typeof password } });
      
      const { user: authUser, error } = await auth.signIn(username, password);
      
      if (error) {
        return { success: false, error };
      }

      console.log('Login successful, setting user:', authUser);
      setUser(authUser);
      
      // Determinar rol (ya viene en el usuario)
      const role = authUser.role;
      console.log('Setting role:', role);
      setUserRole(role);
      
      // Si es mozo, obtener datos del mozo
      if (role === 'mozo') {
        console.log('Getting mozo data for mozo_id:', authUser.mozo_id);
        const mozoInfo = await userRoles.getMozoData(authUser);
        console.log('Mozo data retrieved:', mozoInfo);
        setMozoData(mozoInfo);
      }

      return { success: true, user: authUser, role };
    } catch (error) {
      console.error('Error in useAuth login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserRole(null);
      setMozoData(null);
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const hasRole = (role) => {
    return userRole === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  // Función para refrescar los datos del usuario
  const refreshUserData = async () => {
    if (!user) return;

    try {
      // Si es mozo, refrescar datos del mozo
      if (userRole === 'mozo') {
        const mozoInfo = await userRoles.getMozoData(user);
        setMozoData(mozoInfo);
      }
    } catch (error) {
      console.error('Error refrescando datos del usuario:', error);
    }
  };

  return {
    // Estado
    user,
    userRole,
    mozoData,
    loading,
    initialized,
    
    // Funciones
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    refreshUserData,
    checkAuthState,
    
    // Información útil
    isAdmin: userRole === 'admin',
    isMozo: userRole === 'mozo',
    username: user?.username || null,
    mozoId: mozoData?.id || null,
    mozoName: mozoData?.nombre || null
  };
};

export default useAuth;