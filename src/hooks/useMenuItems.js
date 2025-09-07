import { useState, useEffect, useRef } from 'react';
import { products, supabase } from '../services/supabaseClient';

const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref para controlar la suscripción actual
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeMenu = async () => {
      if (!isMounted) return;
      
      // Cargar elementos del menú
      await loadMenuItems();
      
      // Configurar suscripción solo si el componente sigue montado
      if (isMounted && !isSubscribedRef.current) {
        setupRealtimeSubscription();
      }
    };

    initializeMenu();
      
    return () => {
      isMounted = false;
      cleanupSubscription();
    };
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await products.getActiveProducts();
      
      if (error) {
        throw new Error(error);
      }

      // Organizar productos por categoría
      const organizedMenu = organizeMenuByCategory(data || []);
      setMenuItems(organizedMenu);
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar el menú:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Limpiar suscripción existente antes de crear una nueva
    cleanupSubscription();
    
    console.log('🔄 Configurando nueva suscripción de tiempo real...');
    
    // Crear nueva suscripción
    const channel = supabase
      .channel(`productos_changes_${Date.now()}`) // Nombre único para evitar conflictos
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'productos' 
        },
        (payload) => {
          console.log('Cambio de stock recibido en tiempo real:', payload.new);
          if (payload.new && payload.new.activo) {
            updateLocalStock(payload.new);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Estado de suscripción:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción a tiempo real activa');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de tiempo real:', err);
          isSubscribedRef.current = false;
          
          // Intentar reconectar después de un delay más largo y con backoff
          setTimeout(() => {
            if (channelRef.current) { // Solo reconectar si aún necesitamos la suscripción
              console.log('🔄 Intentando reconectar suscripción...');
              setupRealtimeSubscription();
            }
          }, 5000);
        } else if (status === 'CLOSED') {
          console.log('📡 Canal cerrado');
          isSubscribedRef.current = false;
        }
      });
      
    // Guardar referencia del canal
    channelRef.current = channel;
  };

  const cleanupSubscription = () => {
    if (channelRef.current) {
      console.log('🔌 Desconectando suscripción tiempo real');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  const organizeMenuByCategory = (products) => {
    const categories = {};
    
    products.forEach(product => {
      if (!categories[product.categoria]) {
        categories[product.categoria] = {
          category: product.categoria,
          items: []
        };
      }
      categories[product.categoria].items.push(product);
    });

    return Object.values(categories);
  };

  const updateLocalStock = (updatedProduct) => {
    console.log('🔄 Actualizando stock local:', updatedProduct);
    
    setMenuItems(prevMenuItems => {
      return prevMenuItems.map(category => ({
        ...category,
        items: category.items.map(item => {
          if (item.id === updatedProduct.id) {
            console.log(`📦 Stock actualizado para ${item.nombre}: ${item.stock} → ${updatedProduct.stock}`);
            return { ...item, stock: updatedProduct.stock };
          }
          return item;
        })
      }));
    });
  };

  const decrementStock = async (productId, quantity = 1) => {
    try {
      const { error } = await products.decrementStock(productId, quantity);
      if (error) {
        throw new Error(error);
      }
      return { success: true };
    } catch (err) {
      console.error('Error al decrementar stock:', err);
      return { success: false, error: err.message };
    }
  };

  const incrementStock = async (productId, quantity = 1) => {
    try {
      const { error } = await products.incrementStock(productId, quantity);
      if (error) {
        throw new Error(error);
      }
      return { success: true };
    } catch (err) {
      console.error('Error al incrementar stock:', err);
      return { success: false, error: err.message };
    }
  };

  const adjustStock = async (productId, adjustment) => {
    try {
      const { error } = await products.adjustStock(productId, adjustment);
      if (error) {
        throw new Error(error);
      }
      return { success: true };
    } catch (err) {
      console.error('Error al ajustar stock:', err);
      return { success: false, error: err.message };
    }
  };

  const getProductById = (productId) => {
    for (const category of menuItems) {
      const product = category.items.find(item => item.id === productId);
      if (product) return product;
    }
    return null;
  };

  const getProductsByCategory = (categoryName) => {
    const category = menuItems.find(cat => cat.category === categoryName);
    return category ? category.items : [];
  };

  const getAllProducts = () => {
    return menuItems.flatMap(category => category.items);
  };

  const getAvailableProducts = () => {
    return menuItems.map(category => ({
      ...category,
      items: category.items.filter(item => item.stock > 0)
    })).filter(category => category.items.length > 0);
  };

  const refreshMenu = async () => {
    await loadMenuItems();
    // No necesitas reconfigurar la suscripción aquí, ya está activa
  };

  // Función para reconectar manualmente si es necesario
  const reconnectRealtime = () => {
    setupRealtimeSubscription();
  };

  return {
    // Estado
    menuItems,
    loading,
    error,
    
    // Funciones para stock
    decrementStock,
    incrementStock,
    adjustStock,
    
    // Funciones de búsqueda
    getProductById,
    getProductsByCategory,
    getAllProducts,
    getAvailableProducts,
    
    // Funciones de utilidad
    refreshMenu,
    updateLocalStock,
    reconnectRealtime,
    
    // Información útil
    totalProducts: getAllProducts().length,
    availableProducts: getAvailableProducts().reduce((total, cat) => total + cat.items.length, 0),
    categories: menuItems.map(cat => cat.category),
    
    // Estado de conexión
    isRealtimeConnected: isSubscribedRef.current
  };
};

export default useMenuItems;