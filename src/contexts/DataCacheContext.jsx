import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const DataCacheContext = createContext();

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
};

export const DataCacheProvider = ({ children }) => {
  const [cache, setCache] = useState({
    gastos: [],
    ventas: [],
    categorias: [],
    presupuestos: [],
    cuentasPendientes: [],
    productos: [],
    pedidos: [],
    lastUpdate: null,
    isLoading: false,
    error: null
  });

  // Cargar cache del localStorage al iniciar
  useEffect(() => {
    const savedCache = localStorage.getItem('restaurante_cache');
    if (savedCache) {
      try {
        const parsedCache = JSON.parse(savedCache);
        // Solo usar cache si es de hoy
        const isToday = parsedCache.lastUpdate && 
          new Date(parsedCache.lastUpdate).toDateString() === new Date().toDateString();
        
        if (isToday) {
          console.log('📦 Cargando datos desde cache...');
          setCache(parsedCache);
          return;
        }
      } catch (error) {
        console.error('Error parsing cache:', error);
        localStorage.removeItem('restaurante_cache');
      }
    }
    // Si no hay cache válido, cargar datos
    console.log('🔄 Cargando datos frescos...');
    loadAllData();
  }, []);

  // Guardar cache en localStorage cuando cambie
  useEffect(() => {
    if (cache.lastUpdate && !cache.isLoading) {
      localStorage.setItem('restaurante_cache', JSON.stringify(cache));
    }
  }, [cache]);

  const loadAllData = async () => {
    setCache(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [
        ventasData, 
        gastosData, 
        categoriasData, 
        presupuestosData, 
        cuentasPendientesData,
        productosData,
        pedidosData
      ] = await Promise.all([
        loadVentas(),
        loadGastos(),
        loadCategorias(),
        loadPresupuestos(),
        loadCuentasPendientes(),
        loadProductos(),
        loadPedidos()
      ]);

      setCache({
        gastos: gastosData,
        ventas: ventasData,
        categorias: categoriasData,
        presupuestos: presupuestosData,
        cuentasPendientes: cuentasPendientesData,
        productos: productosData,
        pedidos: pedidosData,
        lastUpdate: new Date().toISOString(),
        isLoading: false,
        error: null
      });

      console.log('✅ Datos cargados y guardados en cache');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setCache(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  };

  // Funciones de carga individuales
  const loadVentas = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items!left (
            *,
            producto:productos!left (*)
          )
        `)
        .eq('estado', 'pagado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading ventas:', err);
      return [];
    }
  };

  const loadGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading gastos:', err);
      return [];
    }
  };

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading categorias:', err);
      return [];
    }
  };

  const loadPresupuestos = async () => {
    try {
      // Cargar presupuestos del año actual
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('año', currentYear)
        .order('mes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading presupuestos:', err);
      return [];
    }
  };

  const loadCuentasPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('cuentas_pendientes')
        .select('*')
        .order('fecha_vencimiento');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading cuentas pendientes:', err);
      return [];
    }
  };

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading productos:', err);
      return [];
    }
  };

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          usuario:usuarios(nombre),
          pedido_items!left (
            *,
            producto:productos!left (*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Limitar para performance

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading pedidos:', err);
      return [];
    }
  };

  // Funciones para actualizar cache específico
  const addToCache = (table, newItem) => {
    setCache(prev => ({
      ...prev,
      [table]: [newItem, ...prev[table]],
      lastUpdate: new Date().toISOString()
    }));
    console.log(`➕ Agregado al cache: ${table}`);
  };

  const updateInCache = (table, id, updatedItem) => {
    setCache(prev => ({
      ...prev,
      [table]: prev[table].map(item => item.id === id ? updatedItem : item),
      lastUpdate: new Date().toISOString()
    }));
    console.log(`📝 Actualizado en cache: ${table} ID:${id}`);
  };

  const removeFromCache = (table, id) => {
    setCache(prev => ({
      ...prev,
      [table]: prev[table].filter(item => item.id !== id),
      lastUpdate: new Date().toISOString()
    }));
    console.log(`🗑️ Eliminado del cache: ${table} ID:${id}`);
  };

  const refreshCache = () => {
    console.log('🔄 Refrescando cache completo...');
    loadAllData();
  };

  const clearCache = () => {
    localStorage.removeItem('restaurante_cache');
    setCache({
      gastos: [],
      ventas: [],
      categorias: [],
      presupuestos: [],
      cuentasPendientes: [],
      productos: [],
      pedidos: [],
      lastUpdate: null,
      isLoading: false,
      error: null
    });
    console.log('🧹 Cache limpiado');
  };

  // Solo para Reporte del Día: forzar consulta fresca
  const getFreshDailyData = async (date) => {
    try {
      console.log(`📊 Cargando datos frescos para: ${date}`);
      
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const [ventasDelDia, gastosDelDia] = await Promise.all([
        supabase
          .from('pedidos')
          .select(`
            *,
            pedido_items!left (
              *,
              producto:productos!left (*)
            )
          `)
          .eq('estado', 'pagado')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay),
        
        supabase
          .from('gastos')
          .select('*')
          .eq('fecha', date)
      ]);

      if (ventasDelDia.error) throw ventasDelDia.error;
      if (gastosDelDia.error) throw gastosDelDia.error;

      return {
        ventas: ventasDelDia.data || [],
        gastos: gastosDelDia.data || []
      };
    } catch (error) {
      console.error('Error loading fresh daily data:', error);
      throw error;
    }
  };

  return (
    <DataCacheContext.Provider value={{
      // Datos del cache
      cache,
      
      // Estados
      isLoading: cache.isLoading,
      error: cache.error,
      
      // Funciones de manipulación de cache
      addToCache,
      updateInCache,
      removeFromCache,
      refreshCache,
      clearCache,
      
      // Función especial para datos frescos
      getFreshDailyData,
      
      // Acceso directo a los datos
      gastos: cache.gastos,
      ventas: cache.ventas,
      categorias: cache.categorias,
      presupuestos: cache.presupuestos,
      cuentasPendientes: cache.cuentasPendientes,
      productos: cache.productos,
      pedidos: cache.pedidos,
      lastUpdate: cache.lastUpdate
    }}>
      {children}
    </DataCacheContext.Provider>
  );
};