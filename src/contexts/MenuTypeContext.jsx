// src/contexts/MenuTypeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabaseClient';

const MenuTypeContext = createContext(null);

export const MenuTypeProvider = ({ children }) => {
  const [menuType, setMenuType] = useState('dia');
  const [loading, setLoading] = useState(true);

  // Cargar el tipo de menú inicial desde Supabase
  useEffect(() => {
    const loadMenuType = async () => {
      try {
        // Buscar configuración del tipo de menú en una tabla de configuraciones
        const { data, error } = await supabaseClient.configuration.getMenuType();
        
        if (error) {
          console.error('Error loading menu type:', error);
          // Si hay error, usar valor por defecto
          setMenuType('dia');
        } else if (data) {
          setMenuType(data.menu_type || 'dia');
        }
      } catch (error) {
        console.error('Error loading menu type:', error);
        setMenuType('dia');
      } finally {
        setLoading(false);
      }
    };

    loadMenuType();
  }, []);

  // Función para refrescar el tipo de menú manualmente
  const refreshMenuType = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.configuration.getMenuType();
      
      if (error) {
        console.error('Error refreshing menu type:', error);
        return { success: false, error: error.message };
      }
      
      if (data) {
        setMenuType(data.menu_type || 'dia');
      }
      return { success: true };
    } catch (error) {
      console.error('Error refreshing menu type:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateMenuType = async (newMenuType) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.configuration.setMenuType(newMenuType);
      
      if (error) {
        console.error('Error updating menu type:', error);
        return { success: false, error: error.message };
      }

      setMenuType(newMenuType);
      return { success: true };
    } catch (error) {
      console.error('Error updating menu type:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    menuType,
    loading,
    updateMenuType,
    refreshMenuType
  };

  return (
    <MenuTypeContext.Provider value={value}>
      {children}
    </MenuTypeContext.Provider>
  );
};

export const useMenuType = () => {
  const context = useContext(MenuTypeContext);
  if (context === undefined) {
    throw new Error('useMenuType debe ser usado dentro de un MenuTypeProvider');
  }
  return context;
};