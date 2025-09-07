import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;


// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Funciones auxiliares para autenticación personalizada
export const auth = {
  // Iniciar sesión con username y password
  signIn: async (email, password) => {
      try {
        // Esta es la función segura de Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        // Si hay un error (ej. contraseña incorrecta), Supabase lo reporta
        if (error) {
          throw error;
        }
        
        // Si el inicio de sesión es exitoso, devolvemos el usuario
        // ¡Supabase se encarga de gestionar la sesión de forma segura por nosotros!
        return { user: data.user, session: data.session, error: null };

      } catch (error) {
        console.error('Error en signIn:', error.message);
        // Devolvemos el mensaje de error para mostrarlo en la interfaz
        return { user: null, error: error.message };
      }
  },

  // Registra un nuevo usuario.
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return { user: data.user, error: null };
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      return { error: error.message };
    }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      return session?.user ?? null;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },
  // Obtiene el perfil del usuario desde tu tabla "usuarios".
  getUserProfile: async (user) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  },

  // Obtener sesión actual
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error al obtener la sesión de Supabase:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  },

  // Verificar si hay sesión válida
  isAuthenticated: async () => {
    const user = await auth.getCurrentUser();
    return user !== null;
  },

  getMozoData: async (profile) => {
    if (!profile || profile.role !== 'mozo' || !profile.mozo_id) return null;
    
    try {
      const { data: mozo, error } = await supabase
        .from('mozos')
        .select('id, nombre') // Pedimos solo lo que necesitamos
        .eq('id', profile.mozo_id)
        .single();
      
      if (error) throw error;
      return mozo;
    } catch (error) {
      console.error('Error obteniendo datos del mozo:', error.message);
      return null;
    }
  }

};

// Funciones para determinar el rol del usuario
export const userRoles = {
  // Determinar el rol basado en el usuario autenticado
  determineRole: async (user) => {
    if (!user) return null;
    return user.role; // El rol ya viene del usuario autenticado
  },

  // Obtener datos del mozo si es un mozo
  getMozoData: async (user) => {
    if (!user || user.role !== 'mozo') return null;

    try {
      console.log('Getting mozo data for mozo_id:', user.mozo_id);
      
      const { data: mozo, error } = await supabase
        .from('mozos')
        .select('*')
        .eq('id', user.mozo_id)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('Error getting mozo data:', error);
        return null;
      }

      console.log('Mozo data found:', mozo);
      return mozo;
    } catch (error) {
      console.error('Error obteniendo datos del mozo:', error);
      return null;
    }
  }
};

// Funciones para productos y stock
export const products = {
  // Obtener todos los productos activos
  getActiveProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Decrementar stock
  decrementStock: async (productId, quantity) => {
    try {
      const { error } = await supabase
        .rpc('decrementar_stock', {
          producto_id: productId,
          cantidad: quantity
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Incrementar stock
  incrementStock: async (productId, quantity) => {
    try {
      const { error } = await supabase
        .rpc('incrementar_stock', {
          producto_id: productId,
          cantidad: quantity
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Ajustar stock (puede ser positivo o negativo)
  adjustStock: async (productId, adjustment) => {
    try {
      const { error } = await supabase
        .rpc('ajustar_stock', {
          producto_id: productId,
          cantidad: adjustment
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Suscribirse a cambios de stock
  subscribeToStockChanges: (callback) => {
    return supabase
      .channel('changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'productos',
          filter: 'activo=eq.true'
        },
        callback
      )
      .subscribe();
  }
};

// Funciones para pedidos
export const orders = {
  // Crear un nuevo pedido
  createOrder: async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Insertar items del pedido
  insertOrderItems: async (items) => {
    try {
      const { error } = await supabase
        .from('pedido_items')
        .insert(items);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Obtener historial de pedidos de un mozo
  getOrderHistory: async (mozoId) => {
    try {
      // Solo ejecutar si hay mozoId válido
      if (!mozoId) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items!left (
            *,
            producto:productos!left (*)
          )
        `)
        .eq('mozo_id', mozoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Marcar pedido como pagado
  markOrderAsPaid: async (orderId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: 'pagado' })
        .eq('id', orderId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Actualizar pedido
  updateOrder: async (orderId, updates) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Obtener items actuales de un pedido
  getOrderItems: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('pedido_items')
        .select('*')
        .eq('pedido_id', orderId);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Eliminar items de un pedido
  deleteOrderItems: async (orderId) => {
    try {
      const { error } = await supabase
        .from('pedido_items')
        .delete()
        .eq('pedido_id', orderId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
};

// Funciones para gastos (para el dashboard admin)
export const gastos = {
  // Obtener todos los gastos
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Crear nuevo gasto
  create: async (gastoData) => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([gastoData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Actualizar gasto
  update: async (id, gastoData) => {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .update(gastoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Eliminar gasto
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
};

// Funciones para presupuestos (para el dashboard admin)
export const presupuestos = {
  // Obtener todos los presupuestos
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .order('año', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Crear nuevo presupuesto
  create: async (presupuestoData) => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .insert([presupuestoData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Actualizar presupuesto
  update: async (id, presupuestoData) => {
    try {
      const { data, error } = await supabase
        .from('presupuestos')
        .update(presupuestoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export default supabase;