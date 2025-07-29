import { useState, useEffect } from 'react';
import { products } from '../services/supabaseClient';

const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenuItems();
    
    // Suscribirse a cambios de stock
    const subscription = subscribeToStockChanges();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
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
    setMenuItems(prevMenuItems => {
      return prevMenuItems.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === updatedProduct.id 
            ? { ...item, stock: updatedProduct.stock } 
            : item
        )
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