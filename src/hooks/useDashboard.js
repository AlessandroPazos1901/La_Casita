import { useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useDataCache } from '../contexts/DataCacheContext';

const useDashboard = () => {
  const { 
    cache,
    isLoading,
    error,
    addToCache,
    updateInCache,
    removeFromCache,
    refreshCache,
    gastos,
    ventas,
    categorias,
    presupuestos,
    cuentasPendientes,
    productos,
    pedidos
  } = useDataCache();

  // =====================================
  // FUNCIONES PARA PRODUCTOS
  // =====================================

  const addProduct = async (productData) => {
    try {
      // Usar siempre la tabla productos unificada
      const { data, error } = await supabase
        .from('productos')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      addToCache('productos', data);
      return { success: true, data };
    } catch (err) {
      console.error('Error añadiendo producto:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      // Usar siempre la tabla productos unificada
      const { data, error } = await supabase
        .from('productos')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      updateInCache('productos', productId, data);
      return { success: true, data };
    } catch (err) {
      console.error('Error actualizando producto:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteProduct = async (productId) => {
    try {
      // Primero, verifica si el producto está en algún pedido
      const { data: pedidoItems, error: checkError } = await supabase
        .from('pedido_items')
        .select('id')
        .eq('producto_id', productId)
        .limit(1);

      if (checkError) throw checkError;

      if (pedidoItems && pedidoItems.length > 0) {
        // Si el producto ya fue usado, no lo eliminamos, solo lo desactivamos
        return await updateProduct(productId, { activo: false });
      } else {
        // Si nunca se ha usado, lo eliminamos permanentemente
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', productId);

        if (error) throw error;
        removeFromCache('productos', productId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error eliminando producto:', err);
      return { success: false, error: err.message };
    }
  };
  // =====================================
  // FUNCIONES PARA CATEGORÍAS
  // =====================================

  const addCategoria = async (categoriaData) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([categoriaData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      addToCache('categorias', data);

      return { success: true, data };
    } catch (err) {
      console.error('Error adding categoria:', err);
      return { success: false, error: err.message };
    }
  };

  const updateCategoria = async (id, categoriaData) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update(categoriaData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      updateInCache('categorias', id, data);

      return { success: true, data };
    } catch (err) {
      console.error('Error updating categoria:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteCategoria = async (id, categoriaNombre) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar cache inmediatamente
      removeFromCache('categorias', id);

      return { success: true };
    } catch (err) {
      console.error('Error deleting categoria:', err);
      return { success: false, error: err.message };
    }
  };

  const checkCategoriaUsage = async (categoriaNombre) => {
    try {
      // Verificar gastos
      const { data: gastosCheck, error: gastosError } = await supabase
        .from('gastos')
        .select('id')
        .eq('categoria', categoriaNombre)
        .limit(1);

      if (gastosError) throw gastosError;

      // Verificar presupuestos
      const { data: presupuestosCheck, error: presupuestosError } = await supabase
        .from('presupuestos')
        .select('id')
        .eq('categoria', categoriaNombre)
        .limit(1);

      if (presupuestosError) throw presupuestosError;

      // Verificar cuentas pendientes
      const { data: cuentasPendientesCheck, error: cuentasPendientesError } = await supabase
        .from('cuentas_pendientes')
        .select('id')
        .eq('categoria', categoriaNombre)
        .limit(1);

      if (cuentasPendientesError) throw cuentasPendientesError;

      return {
        hasGastos: gastosCheck && gastosCheck.length > 0,
        hasPresupuestos: presupuestosCheck && presupuestosCheck.length > 0,
        hasCuentasPendientes: cuentasPendientesCheck && cuentasPendientesCheck.length > 0,
        hasUsage: (gastosCheck && gastosCheck.length > 0) || 
                  (presupuestosCheck && presupuestosCheck.length > 0) || 
                  (cuentasPendientesCheck && cuentasPendientesCheck.length > 0)
      };
    } catch (err) {
      console.error('Error checking categoria usage:', err);
      return { hasGastos: false, hasPresupuestos: false, hasCuentasPendientes: false, hasUsage: false };
    }
  };

  const moveCategoriaData = async (fromCategoria, toCategoria) => {
    try {
      // Mover gastos
      const { error: gastosError } = await supabase
        .from('gastos')
        .update({ categoria: toCategoria })
        .eq('categoria', fromCategoria);

      if (gastosError) throw gastosError;

      // Mover presupuestos
      const { error: presupuestosError } = await supabase
        .from('presupuestos')
        .update({ categoria: toCategoria })
        .eq('categoria', fromCategoria);

      if (presupuestosError) throw presupuestosError;

      // Mover cuentas pendientes
      const { error: cuentasPendientesError } = await supabase
        .from('cuentas_pendientes')
        .update({ categoria: toCategoria })
        .eq('categoria', fromCategoria);

      if (cuentasPendientesError) throw cuentasPendientesError;

      // Refrescar cache para actualizar las relaciones
      refreshCache();

      return { success: true };
    } catch (err) {
      console.error('Error moving categoria data:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================
  // FUNCIONES PARA GASTOS
  // =====================================

  const addGasto = async (gastoData) => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([gastoData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      addToCache('gastos', data);

      return { success: true, data };
    } catch (err) {
      console.error('Error adding gasto:', err);
      return { success: false, error: err.message };
    }
  };

  const updateGasto = async (id, gastoData) => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .update(gastoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      updateInCache('gastos', id, data);

      return { success: true, data };
    } catch (err) {
      console.error('Error updating gasto:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteGasto = async (id) => {
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar cache inmediatamente
      removeFromCache('gastos', id);

      return { success: true };
    } catch (err) {
      console.error('Error deleting gasto:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================
  // FUNCIONES PARA CUENTAS PENDIENTES
  // =====================================

  const addCuentaPendiente = async (cuentaData) => {
    try {
      const { data, error } = await supabase
        .from('cuentas_pendientes')
        .insert([cuentaData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      addToCache('cuentasPendientes', data);

      return { success: true, data };
    } catch (err) {
      console.error('Error adding cuenta pendiente:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteCuentaPendiente = async (id) => {
    try {
      const { error } = await supabase
        .from('cuentas_pendientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar cache inmediatamente
      removeFromCache('cuentasPendientes', id);

      return { success: true };
    } catch (err) {
      console.error('Error deleting cuenta pendiente:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================
  // FUNCIONES PARA PRESUPUESTOS
  // =====================================

  const addPresupuesto = async (presupuestoData) => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .insert([presupuestoData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      addToCache('presupuestos', data);

      return { success: true, data };
    } catch (err) {
      console.error('Error adding presupuesto:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePresupuesto = async (id, presupuestoData) => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .update(presupuestoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar cache inmediatamente
      updateInCache('presupuestos', id, data);

      return { success: true, data };
    } catch (err) {
      console.error('Error updating presupuesto:', err);
      return { success: false, error: err.message };
    }
  };

  const deletePresupuesto = async (id) => {
    try {
      const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar cache inmediatamente
      removeFromCache('presupuestos', id);

      return { success: true };
    } catch (err) {
      console.error('Error deleting presupuesto:', err);
      return { success: false, error: err.message };
    }
  };

  // =====================================
  // FUNCIONES DE UTILIDAD
  // =====================================

  const getVentasByDateRange = (startDate, endDate) => {
    return ventas.filter(venta => {
      const fechaVenta = new Date(venta.created_at);
      return fechaVenta >= new Date(startDate) && fechaVenta <= new Date(endDate);
    });
  };

  const getGastosByDateRange = (startDate, endDate) => {
    return gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      return fechaGasto >= new Date(startDate) && fechaGasto <= new Date(endDate);
    });
  };

  // =====================================
  // ESTADÍSTICAS CALCULADAS
  // =====================================

  const estadisticas = useMemo(() => {
    if (!ventas.length && !gastos.length && !pedidos.length) return null;

    const hoy = new Date().toDateString();
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Ventas del día
    const ventasHoy = ventas.filter(venta => 
      new Date(venta.created_at).toDateString() === hoy
    );
    const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);

    // Ventas del mes
    const ventasMes = ventas.filter(venta => {
      const fechaVenta = new Date(venta.created_at);
      return fechaVenta >= inicioMes && fechaVenta <= finMes;
    });
    const totalVentasMes = ventasMes.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);

    // Gastos del mes
    const gastosMes = gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      return fechaGasto >= inicioMes && fechaGasto <= finMes;
    });
    const totalGastosMes = gastosMes.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);

    // Ganancia del mes
    const gananciaMes = totalVentasMes - totalGastosMes;

    // Pedidos del día
    const pedidosHoy = pedidos.filter(pedido => 
      new Date(pedido.created_at).toDateString() === hoy
    );

    // Productos más vendidos
    const productosVendidos = {};
    ventas.forEach(venta => {
      venta.pedido_items?.forEach(item => {
        const productoNombre = item.producto?.nombre || 'Producto desconocido';
        if (!productosVendidos[productoNombre]) {
          productosVendidos[productoNombre] = 0;
        }
        productosVendidos[productoNombre] += item.cantidad || 0;
      });
    });

    const topProductos = Object.entries(productosVendidos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // Gastos por categoría
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      if (!gastosPorCategoria[gasto.categoria]) {
        gastosPorCategoria[gasto.categoria] = 0;
      }
      gastosPorCategoria[gasto.categoria] += parseFloat(gasto.monto || 0);
    });

    return {
      totalVentasHoy,
      totalVentasMes,
      totalGastosMes,
      gananciaMes,
      pedidosHoy: pedidosHoy.length,
      totalPedidos: pedidos.length,
      topProductos,
      gastosPorCategoria,
      promedioVentaDiaria: totalVentasMes / new Date().getDate(),
      pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      pedidosPagados: pedidos.filter(p => p.estado === 'pagado').length
    };
  }, [ventas, gastos, pedidos]);

  // =====================================
  // RETURN DEL HOOK
  // =====================================

  return {
    // Estados principales
    loading: isLoading,
    error,
    
    // Datos del cache
    ventas,
    gastos,
    categorias,
    presupuestos,
    cuentasPendientes,
    productos,
    pedidos,
    estadisticas,
    
    // Funciones de refresh
    refreshData: refreshCache,
  
    // Funciones para categorías
    addCategoria,
    updateCategoria,
    deleteCategoria,
    checkCategoriaUsage,
    moveCategoriaData,
    
    // Funciones para gastos
    addGasto,
    updateGasto,
    deleteGasto,
    
    // Funciones para cuentas pendientes
    addCuentaPendiente,
    deleteCuentaPendiente,
    
    // Funciones para presupuestos
    addPresupuesto,
    updatePresupuesto,
    deletePresupuesto,

    // Funciones para productos
    addProduct,
    updateProduct,
    deleteProduct,

    // Funciones de utilidad
    getVentasByDateRange,
    getGastosByDateRange,
    
    // Compatibilidad con código existente
    dashboardData: {
      ventas,
      gastos,
      categorias,
      presupuestos,
      cuentasPendientes,
      productos,
      pedidos,
      estadisticas
    }
  };
};

export default useDashboard;