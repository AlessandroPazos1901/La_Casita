import { useState, useEffect, useRef } from 'react';
import { products, nightProducts, supabase } from '../services/supabaseClient';
import { useMenuType } from '../contexts/MenuTypeContext';

const useMenuItems = () => {
  const { menuType, loading: menuTypeLoading } = useMenuType();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref para controlar la suscripción actual
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastHeartbeatRef = useRef(Date.now());

  useEffect(() => {
    let isMounted = true;

    const initializeMenu = async () => {
      if (!isMounted || menuTypeLoading) return;

      // Cargar elementos del menú
      await loadMenuItems();

      // Configurar suscripción solo si el componente sigue montado
      if (isMounted && !isSubscribedRef.current) {
        setupRealtimeSubscription();
        setupVisibilityHandlers();
        setupHeartbeat();
      }
    };

    initializeMenu();

    return () => {
      isMounted = false;
      cleanupAll();
    };
  }, [menuTypeLoading]);

  // Recargar menú cuando cambie el tipo
  useEffect(() => {
    if (menuType && !menuTypeLoading) {
      console.log(`🔄 Tipo de menú cambió a: ${menuType} - recargando...`);
      loadMenuItems();
    }
  }, [menuType, menuTypeLoading]);

  // Manejar cambios de visibilidad de la página
  const setupVisibilityHandlers = () => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Página visible - verificando conexión...');
        if (!isSubscribedRef.current) {
          console.log('🔄 Reconectando suscripción al volver a la página...');
          setupRealtimeSubscription();
        }
        setupHeartbeat();
      } else {
        console.log('👁️ Página oculta - pausando heartbeat...');
        clearHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function will be handled in cleanupAll
  };

  // Sistema de heartbeat para detectar conexiones perdidas
  const setupHeartbeat = () => {
    clearHeartbeat();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && isSubscribedRef.current) {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
        
        // Si ha pasado más de 2 minutos sin heartbeat, reconectar
        if (timeSinceLastHeartbeat > 120000) {
          console.log('💓 Heartbeat perdido - reconectando...');
          setupRealtimeSubscription();
        }
        
        lastHeartbeatRef.current = Date.now();
      }
    }, 30000); // Verificar cada 30 segundos
  };

  const clearHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const cleanupAll = () => {
    cleanupSubscription();
    clearHeartbeat();
    
    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Limpiar event listeners
    document.removeEventListener('visibilitychange', setupVisibilityHandlers);
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let data = [];
      let error = null;

      // Siempre cargar de la tabla productos unificada
      console.log(`🔄 Cargando productos para carta ${menuType === 'noche' ? 'nocturna' : 'diurna'}...`);
      const result = await products.getActiveProducts();

      if (result.data) {
        // Filtrar productos según el tipo de carta actual
        if (menuType === 'noche') {
          // Carta de noche: mostrar productos 'noche' o 'ambos'
          data = result.data.filter(product =>
            product.tipo_carta === 'noche' || product.tipo_carta === 'ambos'
          );
        } else {
          // Carta del día: mostrar productos 'dia', 'ambos' o null/undefined (default)
          data = result.data.filter(product =>
            product.tipo_carta === 'dia' ||
            product.tipo_carta === 'ambos' ||
            !product.tipo_carta ||
            product.tipo_carta === null
          );
        }
      }
      error = result.error;

      if (error) {
        throw new Error(error);
      }

      // Organizar productos por categoría según el tipo de carta
      const organizedMenu = organizeMenuByCategory(data || [], menuType);
      setMenuItems(organizedMenu);

      console.log(`📋 Cargados ${data?.length || 0} productos para carta ${menuType === 'noche' ? 'nocturna' : 'diurna'}`);
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
    
    // Crear nueva suscripción con nombre único por sesión
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(`productos_changes_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'productos'
        },
        (payload) => {
          console.log('🔄 Cambio de stock en productos recibido:', payload.new);
          lastHeartbeatRef.current = Date.now(); // Actualizar heartbeat
          if (payload.new && payload.new.activo) {
            // Verificar si el producto actualizado debe mostrarse en la carta actual
            const shouldShowInCurrentMenu = (menuType === 'noche')
              ? (payload.new.tipo_carta === 'noche' || payload.new.tipo_carta === 'ambos')
              : (payload.new.tipo_carta === 'dia' || payload.new.tipo_carta === 'ambos' || !payload.new.tipo_carta || payload.new.tipo_carta === null);

            if (shouldShowInCurrentMenu) {
              updateLocalStock(payload.new);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Estado de suscripción [${sessionId}]:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción a tiempo real activa');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de tiempo real:', err);
          isSubscribedRef.current = false;
          
          // Intentar reconectar después de un delay progresivo
          const retryDelay = Math.min(5000 + Math.random() * 2000, 30000); // 5-7 segundos, máximo 30
          console.log(`🔄 Reintentando reconexión en ${retryDelay}ms...`);
          
          // Limpiar timeout anterior si existe
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === 'visible') {
              console.log('🔄 Intentando reconectar suscripción...');
              setupRealtimeSubscription();
            }
            reconnectTimeoutRef.current = null;
          }, retryDelay);
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

  const organizeMenuByCategory = (products, currentMenuType) => {
    const categories = {};
    // console.log(`🏷️ Organizando categorías para tipo de carta: ${currentMenuType}`);

    products.forEach(product => {
      // Determinar qué categoría usar según el tipo de carta
      let categoryName;
      if (currentMenuType === 'noche') {
        // Para carta nocturna, usar categoria_noche si existe, sino categoria
        categoryName = product.categoria_noche || product.categoria;
        // console.log(`🌙 Producto ${product.nombre}: categoria_noche="${product.categoria_noche}" → usando "${categoryName}"`);
      } else {
        // Para carta diurna, usar categoria
        categoryName = product.categoria;
        // console.log(`☀️ Producto ${product.nombre}: categoria="${product.categoria}" → usando "${categoryName}"`);
      }

      // Solo procesar si hay categoría válida
      if (categoryName) {
        if (!categories[categoryName]) {
          categories[categoryName] = {
            category: categoryName,
            items: []
          };
        }
        categories[categoryName].items.push(product);
      }
    });

    const finalCategories = Object.values(categories);
    console.log(`📋 Categorías finales para carta ${currentMenuType}:`, finalCategories.map(cat => `${cat.category} (${cat.items.length} productos)`));

    return finalCategories;
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
      // Ahora todos los productos están en la tabla productos unificada
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
      // Ahora todos los productos están en la tabla productos unificada
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
      // Ahora todos los productos están en la tabla productos unificada
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
    
    // Estado de conexión mejorado
    isRealtimeConnected: isSubscribedRef.current,
    lastHeartbeat: lastHeartbeatRef.current,
    connectionHealth: () => {
      if (!isSubscribedRef.current) return 'disconnected';
      const timeSinceHeartbeat = Date.now() - lastHeartbeatRef.current;
      if (timeSinceHeartbeat > 120000) return 'stale';
      if (timeSinceHeartbeat > 60000) return 'warning';
      return 'healthy';
    }
  };
};

export default useMenuItems;