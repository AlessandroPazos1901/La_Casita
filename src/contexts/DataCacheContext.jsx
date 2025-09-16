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

      // Primero intentamos obtener datos de la tabla 'pedidos' (día actual)
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

      let ventas = ventasDelDia.data || [];
      let gastos = gastosDelDia.data || [];

      // Si no hay ventas en 'pedidos', buscar en datos históricos
      if (ventas.length === 0) {
        console.log(`🔍 No se encontraron pedidos activos para ${date}, buscando datos históricos...`);

        try {
          // Obtener datos de productos vendidos de reportes_productos_diarios
          const reportesProductosResult = await supabase
            .from('reportes_productos_diarios')
            .select(`
              *,
              producto:productos!left (*)
            `)
            .eq('fecha', date);

          let productosVendidos = [];
          let totalIngresosDia = 0;

          if (reportesProductosResult.data && !reportesProductosResult.error && reportesProductosResult.data.length > 0) {
            const reportesProductos = reportesProductosResult.data;
            console.log(`✅ Encontrados productos vendidos para ${date}:`, reportesProductos);

            // Procesar productos vendidos con detalles completos
            productosVendidos = reportesProductos.map(reporte => ({
              nombre: reporte.producto?.nombre || `Producto ${reporte.producto_id}`,
              cantidad: parseInt(reporte.cantidad_vendida || 0),
              precioUnitario: reporte.cantidad_vendida > 0 ?
                parseFloat(reporte.ingresos_generados || 0) / parseInt(reporte.cantidad_vendida) : 0,
              total: parseFloat(reporte.ingresos_generados || 0)
            }));

            totalIngresosDia = reportesProductos.reduce((sum, reporte) =>
              sum + parseFloat(reporte.ingresos_generados || 0), 0);
          }

          // Intentar obtener datos de reportes_diarios para métodos de pago
          const reportesDiariosResult = await supabase
            .from('reportes_diarios')
            .select('*')
            .eq('fecha', date)
            .maybeSingle();

          let datosCompletos = null;
          if (reportesDiariosResult.data && !reportesDiariosResult.error) {
            datosCompletos = reportesDiariosResult.data;
            console.log(`✅ Encontrado reporte diario completo para ${date}:`, datosCompletos);
          }

          // Si no hay reporte diario completo, usar vista ventas_diarias para totales
          if (!datosCompletos && totalIngresosDia === 0) {
            console.log(`📊 Intentando con vista ventas_diarias para ${date}...`);

            const ventasDiariasResult = await supabase
              .from('ventas_diarias')
              .select('*')
              .eq('fecha', date);

            if (ventasDiariasResult.data && ventasDiariasResult.data.length > 0) {
              const ventaDiaria = ventasDiariasResult.data[0];
              totalIngresosDia = ventaDiaria.total_ventas || 0;
              console.log(`✅ Encontrado en vista ventas_diarias para ${date}:`, ventaDiaria);
            }
          }

          // Crear venta simulada con todos los datos disponibles
          if (totalIngresosDia > 0 || productosVendidos.length > 0) {
            ventas = [{
              id: `historico-${date}`,
              numero_pedido: `Histórico ${date}`,
              total: datosCompletos?.ingresos_totales || totalIngresosDia,
              metodo_pago: 'resumen',
              created_at: `${date}T12:00:00`,
              estado: 'pagado',
              mesa: 'Resumen Histórico',
              resumen_diario: {
                ingresos_efectivo: datosCompletos?.ingresos_efectivo || 0,
                ingresos_pos: datosCompletos?.ingresos_pos || 0,
                ingresos_yape_plin: datosCompletos?.ingresos_yape_plin || 0,
                numero_pedidos: datosCompletos?.total_pedidos ||
                  (productosVendidos.length > 0 ? productosVendidos.length : 1),
                productos_vendidos: productosVendidos,
                pedidos_detalle: datosCompletos?.pedidos_detalle ?
                  (typeof datosCompletos.pedidos_detalle === 'string' ?
                    JSON.parse(datosCompletos.pedidos_detalle) :
                    datosCompletos.pedidos_detalle) : []
              },
              pedido_items: []
            }];
          }
        } catch (error) {
          console.error('Error buscando datos históricos:', error);
        }
      }

      return {
        ventas,
        gastos
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