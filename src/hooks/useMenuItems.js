import { useState, useEffect } from 'react';
import { products, supabase } from '../services/supabaseClient';

const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenuItems();
    
    // Suscribirse a cambios de stock
    //const subscription = subscribeToStockChanges();
    // Crea un canal para escuchar cambios en la tabla 'productos'
    const channel = supabase
      .channel('postgresChangesChannel')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'productos' 
        },
        (payload) => {
          console.log('Cambio de stock recibido en tiempo real:', payload.new);
          // Llama a la función que ya tienes para actualizar el estado local
          if (payload.new && payload.new.activo) {
            updateLocalStock(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción a tiempo real activa');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de tiempo real');
          // Intentar reconectar después de un delay
          setTimeout(() => {
            console.log('🔄 Intentando reconectar...');
            loadMenuItems();
          }, 3000);
        }
      });
      
    return () => {
      console.log('🔌 Desconectando suscripción tiempo real');
      supabase.removeChannel(channel);
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

  const subscribeToStockChanges = () => {
    return products.subscribeToStockChanges((payload) => {
      console.log('Stock actualizado:', payload);
      updateLocalStock(payload.new);
    });
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

  const refreshMenu = () => {
    loadMenuItems();
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
    
    // Información útil
    totalProducts: getAllProducts().length,
    availableProducts: getAvailableProducts().reduce((total, cat) => total + cat.items.length, 0),
    categories: menuItems.map(cat => cat.category)
  };
};

export default useMenuItems;