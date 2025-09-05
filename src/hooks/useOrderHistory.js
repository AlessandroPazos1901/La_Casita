import { useState, useEffect } from 'react';
import { orders, supabase } from '../services/supabaseClient';

const useOrderHistory = (userId, userRole) => {
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      // 1. Carga los datos iniciales al montar el componente
      loadOrderHistory();

      // 2. Crea un canal de comunicación en tiempo real con la tabla 'pedidos'
      const channel = supabase
        .channel('realtime-pedidos')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pedidos' }, // Escucha INSERT y UPDATE
          (payload) => {
            console.log('¡Cambio en tiempo real recibido!', payload);
            
            // Actualizamos el estado local con los nuevos datos del pedido
            // Esto es para UPDATE. Si un pedido se actualiza (ej: se paga), lo reemplazamos.
            if (payload.eventType === 'UPDATE') {
              setOrdersHistory(prevOrders =>
                prevOrders.map(order =>
                  order.id === payload.new.id
                    // Unimos los datos viejos con los nuevos para no perder detalles como 'pedido_items'
                    ? { ...order, ...payload.new } 
                    : order
                )
              );
            }
            // Esto es para INSERT. Si un nuevo pedido se crea, lo añadimos al principio de la lista.
            if (payload.eventType === 'INSERT') {
              // Nota: El payload.new no tendrá los datos de 'mozo' o 'pedido_items'.
              // Una recarga simple es lo más fácil aquí para obtener todos los datos anidados.
              loadOrderHistory();
            }
          }
        )
        .subscribe();

      // 3. Función de limpieza: cierra la conexión al salir de la página
      return () => {
        supabase.removeChannel(channel);
      };
    }, [userId, userRole]);

  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      // 2. La ajustamos para que represente el inicio del día (medianoche).
      today.setHours(0, 0, 0, 0);
      // 3. La convertimos a un formato estándar que la base de datos entiende.
      const startOfDay = today.toISOString();

      // 2. Creamos la consulta base con la optimización de fecha
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items!left(*, producto:productos!left(*))
        `) 
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: true });



      // 3. AJUSTE DE ROL: Ahora un 'mozo' es el único caso especial.
      //    Admins y Cajeros verán todos los pedidos del día.
      if (userRole === 'mozo' && userId) {
        query = query.eq('usuario_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrdersHistory(data || []);

    } catch (err) {
      setError(err.message);
      console.error('Error al cargar historial de pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    try {
      const { data, error } = await orders.createOrder(orderData);
      
      if (error) {
        throw new Error(error);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error al crear pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const insertOrderItems = async (items) => {
    try {
      const { error } = await orders.insertOrderItems(items);
      
      if (error) {
        throw new Error(error);
      }

      return { success: true };
    } catch (err) {
      console.error('Error al insertar items del pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const markOrderAsPaid = async (orderId) => {
    try {
      const { error } = await orders.markOrderAsPaid(orderId);
      
      if (error) {
        throw new Error(error);
      }

      // Actualizar el estado local
      setOrdersHistory(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, estado: 'pagado' }
            : order
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error al marcar pedido como pagado:', err);
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId)
        .select(`
          *,
          pedido_items!left(*, producto:productos!left(*)),
          usuario:usuarios(nombre)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setOrdersHistory(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedData : order
        )
      );

      // DEVOLVEMOS EL PEDIDO ACTUALIZADO
      return { success: true, data: updatedData };
    } catch (err) {
      console.error('Error al actualizar pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const getOrderItems = async (orderId) => {
    try {
      const { data, error } = await orders.getOrderItems(orderId);
      
      if (error) {
        throw new Error(error);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error al obtener items del pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteOrderItems = async (orderId) => {
    try {
      const { error } = await orders.deleteOrderItems(orderId);
      
      if (error) {
        throw new Error(error);
      }

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar items del pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      // Llamamos a la función de la base de datos
      const { error } = await supabase.rpc('delete_order_and_restock', {
        order_id_to_delete: orderId
      });

      if (error) {
        throw new Error(error.message);
      }

      // Actualizamos el estado local para que el pedido desaparezca de la UI al instante
      setOrdersHistory(prevOrders =>
        prevOrders.filter(order => order.id !== orderId)
      );

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar pedido:', err);
      return { success: false, error: err.message };
    }
  };

  const refreshOrderHistory = () => {
    loadOrderHistory();
  };

  // Funciones de utilidad
  const getPendingOrders = () => {
    return ordersHistory.filter(order => order.estado === 'pendiente');
  };

  const getPaidOrders = () => {
    return ordersHistory.filter(order => order.estado === 'pagado');
  };

  const getOrdersByDate = (date) => {
    const targetDate = new Date(date).toDateString();
    return ordersHistory.filter(order => 
      new Date(order.created_at).toDateString() === targetDate
    );
  };

  const getOrderById = (orderId) => {
    return ordersHistory.find(order => order.id === orderId);
  };

  const getTotalSales = () => {
    return ordersHistory.reduce((total, order) => {
      return total + (parseFloat(order.total) || 0);
    }, 0);
  };

  const getTotalSalesByDate = (date) => {
    const ordersFromDate = getOrdersByDate(date);
    return ordersFromDate.reduce((total, order) => {
      return total + (parseFloat(order.total) || 0);
    }, 0);
  };


  const getOrdersStats = () => {
    const totalOrders = ordersHistory.length;
    const pendingOrders = getPendingOrders().length;
    const paidOrders = getPaidOrders().length;
    const totalSales = getTotalSales();

    return {
      totalOrders,
      pendingOrders,
      paidOrders,
      totalSales,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
    };
  };

  return {
    // Estado
    ordersHistory,
    loading,
    error,
    
    // Funciones CRUD
    createOrder,
    insertOrderItems,
    markOrderAsPaid,
    updateOrder,
    deleteOrder,
    getOrderItems,
    deleteOrderItems,
    
    // Funciones de utilidad
    refreshOrderHistory,
    getPendingOrders,
    getPaidOrders,
    getOrdersByDate,
    getOrderById,
    getTotalSales,
    getTotalSalesByDate,
    getOrdersStats,
    
    // Estadísticas
    stats: getOrdersStats()
  };
};

export default useOrderHistory;