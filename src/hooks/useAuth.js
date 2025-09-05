import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/supabaseClient';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = useCallback(async () => {
    console.log('AUTH: Verificando estado de autenticación...');
    try {
      const currentUser = await auth.getCurrentUser();
      console.log('AUTH: currentUser:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        
        const userProfile = await auth.getUserProfile(currentUser);
        console.log('AUTH: userProfile:', userProfile);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('AUTH: Error en checkAuthState:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
      console.log('AUTH: Verificación de estado finalizada.');
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = async (username, password) => {
    try {
      console.log('LOGIN: 1. Iniciando función de login...');
      const email = `${username.trim()}@gmail.com`;

      // Hacemos el signIn
      const { user: authUser, error } = await auth.signIn(email, password);

      // Si hay un error, lo manejamos y salimos
      if (error) {
        console.error('LOGIN: Error de Supabase detectado en signIn:', error.message);
        return { success: false, error: 'Usuario o contraseña incorrectos.' };
      }
      
      console.log('LOGIN: 2. SignIn exitoso. Usuario recibido:', authUser);

      // Si signIn fue exitoso, authUser no debería ser nulo, pero es bueno comprobarlo
      if (!authUser) {
        return { success: false, error: 'No se recibió el usuario después del login.' };
      }

      // 3. Usamos el 'authUser' que acabamos de recibir para actualizar el estado
      setUser(authUser);
      const userProfile = await auth.getUserProfile(authUser);
      console.log('LOGIN: 3. Perfil obtenido:', userProfile);
      setProfile(userProfile);

      console.log('LOGIN: 5. Login y actualización de estado completados.');
      return { success: true };

    } catch (error) {
      console.error('LOGIN: Error fatal atrapado en el bloque catch de login:', error);
      return { success: false, error: 'Ocurrió un error inesperado.' };
    }
  };

  const logout = async () => {
    try {
      console.log('LOGOUT: 1. Cierre de sesión iniciado.');
      await auth.signOut();
      setUser(null);
      setProfile(null);
      // return { success: true };
      console.log('LOGOUT: 2. Estado local limpiado.');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      //return { success: false, error: error.message };
    }
  };
  
  const userRole = profile?.role || null;

  return {
    // Estado
    user,
    profile,
    userRole,
    loading,
    
    // Funciones
    login,
    logout,

    // Información útil y computada
    isAuthenticated: !!user,
    isAdmin: userRole === 'admin',
    isMozo: userRole === 'mozo',
    isCajero: userRole === 'cajero',
    userName: profile?.nombre || 'Usuario',
    hasManagementAccess: userRole === 'admin' || userRole === 'cajero',
  };
};

export default useAuth;