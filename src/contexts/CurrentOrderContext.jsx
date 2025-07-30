import React, { createContext, useContext, useState } from 'react';
import useMenuItems from '../hooks/useMenuItems';
import useOrderHistory from '../hooks/useOrderHistory';

// 1. Creamos el contexto
const CurrentOrderContext = createContext();

// 2. Creamos el Provider, que contendrá toda la lógica
export const CurrentOrderProvider = ({ children, mozoData, userRole }) => {
  const [currentOrder, setCurrentOrder] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { decrementStock, incrementStock, adjustStock } = useMenuItems();
  const { 
    createOrder, 
    insertOrderItems, 
    updateOrder, 
    getOrderItems, 
    deleteOrderItems,
    refreshOrderHistory 
  } = useOrderHistory(mozoData?.id, userRole);
  const clearOrderError = () => setError(null);
  const addToOrder = async (item) => {
    if (!item || item.stock <= 0) {
      setError(`Lo sentimos, "${item.nombre}" no está disponible en este momento.`);
      return { success: false, error: 'Producto no disponible' };
    }

    try {
      // Decrementar stock en la base de datos inmediatamente
      const stockResult = await decrementStock(item.id, 1);
      if (!stockResult.success) {
        throw new Error(stockResult.error);
      }

      // Buscar si ya existe el item en el pedido (sin notas)
      const existingItemIndex = currentOrder.findIndex(
        (orderItem) => orderItem.id === item.id && !orderItem.notas
      );

      if (existingItemIndex > -1) {
        // Si existe, incrementar cantidad
        const updatedOrder = [...currentOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        updatedOrder[existingItemIndex].individuals.push({
          subId: Date.now() + Math.random(),
          notas: ''
        });
        setCurrentOrder(updatedOrder);
      } else {
        // Si no existe, agregar nuevo item
        const newItem = { 
          ...item, 
          orderId: Date.now() + Math.random(), 
          quantity: 1, 
          notas: '' ,
          individuals: [{ subId: Date.now(), notas: '' }]
        };
        setCurrentOrder(prevOrder => [...prevOrder, newItem]);
      }

      return { 
        success: true, 
        productId: item.id, 
        newStock: item.stock - 1 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const removeItemFromOrder = async (orderId) => {
    const itemToRemove = currentOrder.find(item => item.orderId === orderId);
    
    if (!itemToRemove) {
      return { success: false, error: 'Item no encontrado' };
    }

    try {
      // Incrementar stock en la base de datos
      const stockResult = await incrementStock(itemToRemove.id, itemToRemove.quantity);
      if (!stockResult.success) {
        throw new Error(stockResult.error);
      }

      // Remover del pedido actual
      setCurrentOrder(prevOrder => prevOrder.filter(item => item.orderId !== orderId));
      return { 
        success: true, 
        productId: itemToRemove.id, 
        stockIncrement: itemToRemove.quantity 
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateOrderItem = async (updatedItem) => {
    const originalItem = currentOrder.find(item => item.orderId === updatedItem.orderId);
    
    if (!originalItem) {
      return { success: false, error: 'Item no encontrado' };
    }

    const quantityDifference = updatedItem.quantity - originalItem.quantity;
    
    if (quantityDifference !== 0) {
      try {
        // Ajustar stock según la diferencia
        const stockResult = await adjustStock(updatedItem.id, -quantityDifference);
        if (!stockResult.success) {
          throw new Error(stockResult.error);
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    }

    // Actualizar item en el pedido
    setCurrentOrder(prevOrder => prevOrder.map(item =>
      item.orderId === updatedItem.orderId ? updatedItem : item
    ));

    return { success: true };
  };

  const sendOrder = async () => {
    if (currentOrder.length === 0) {
      setError('El pedido está vacío. Por favor, añade algunos platos.');
      return { success: false, error: 'Pedido vacío' };
    }

    if (!tableNumber.trim()) {
      setError('Por favor, ingresa el número de mesa.');
      return { success: false, error: 'Número de mesa requerido' };
    }

    setLoading(true);
    setError(null);

    try {
      const total = currentOrder.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
      let orderId;

      if (editingOrderId) {
        // ACTUALIZANDO PEDIDO EXISTENTE
        const result = await updateExistingOrder(editingOrderId, total);
        if (!result.success) {
          throw new Error(result.error);
        }
        orderId = editingOrderId;
      } else {
        // CREANDO NUEVO PEDIDO
        const result = await createNewOrder(total);
        if (!result.success) {
          throw new Error(result.error);
        }
        orderId = result.orderId;
      }

      // Limpiar el pedido actual
      clearCurrentOrder();
      
      // IMPORTANTE: Forzar recarga inmediata del historial
      console.log('Pedido creado/actualizado, refrescando historial...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      refreshOrderHistory();

      return { success: true, orderId };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const createNewOrder = async (total) => {
    try {
      // Crear el pedido
      const orderResult = await createOrder({
        mesa: tableNumber,
        mozo_id: mozoData?.id || null, // Asegurar que sea null si no hay mozo
        origen: 'mesa',
        total: total,
        estado: 'pendiente'
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Insertar items del pedido
    const itemsToInsert = currentOrder.map(item => {
      const notasAGuardar = item.individuals
          .map(individual => individual.notas)
          .filter(nota => nota && nota.trim() !== '');

  
      return {
          pedido_id: orderResult.data.id,
          producto_id: item.id,
          cantidad: item.quantity,
          precio_unitario: item.precio,
          
          notas: notasAGuardar.length > 0 ? JSON.stringify(notasAGuardar) : null
      };  
    });

      const itemsResult = await insertOrderItems(itemsToInsert);
      if (!itemsResult.success) {
        throw new Error(itemsResult.error);
      }

      return { success: true, orderId: orderResult.data.id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateExistingOrder = async (orderId, total) => {
    console.log("Datos en currentOrder ANTES de actualizar:", JSON.stringify(currentOrder, null, 2));
    try {
      // Obtener items actuales del pedido
      const currentItemsResult = await getOrderItems(orderId);
      if (!currentItemsResult.success) {
        throw new Error(currentItemsResult.error);
      }

      const currentItems = currentItemsResult.data;

      // Calcular ajustes de stock
      const stockAdjustments = {};
      
      // Restaurar stock de items originales
      currentItems.forEach(item => {
        if (!stockAdjustments[item.producto_id]) {
          stockAdjustments[item.producto_id] = 0;
        }
        stockAdjustments[item.producto_id] += item.cantidad;
      });

      // Descontar stock de items nuevos
      currentOrder.forEach(item => {
        if (!stockAdjustments[item.id]) {
          stockAdjustments[item.id] = 0;
        }
        stockAdjustments[item.id] -= item.quantity;
      });

      // Eliminar items anteriores
      const deleteResult = await deleteOrderItems(orderId);
      if (!deleteResult.success) {
        throw new Error(deleteResult.error);
      }

      // Insertar nuevos items
        const itemsToInsert = currentOrder.map(item => {
        // Recogemos todas las notas individuales que no estén vacías
        const notasAGuardar = item.individuals
          .map(individual => individual.notas)
          .filter(nota => nota && nota.trim() !== '');

        // Devolvemos el objeto para insertar en la base de datos
        return {
          pedido_id: orderId,
          producto_id: item.id,
          cantidad: item.quantity,
          precio_unitario: item.precio,
          // Si hay notas, las convertimos a JSON. Si no, guardamos null.
          notas: notasAGuardar.length > 0 ? JSON.stringify(notasAGuardar) : null
        };
      });

      const insertResult = await insertOrderItems(itemsToInsert);
      if (!insertResult.success) {
        throw new Error(insertResult.error);
      }

      // Actualizar total del pedido
      const updateResult = await updateOrder(orderId, { 
        total: total,
        mesa: tableNumber 
      });
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Aplicar ajustes de stock
      for (const [productId, adjustment] of Object.entries(stockAdjustments)) {
        if (adjustment !== 0) {
          const stockResult = await adjustStock(parseInt(productId), -adjustment);
          if (!stockResult.success) {
            console.error('Error ajustando stock:', stockResult.error);
          }
        }
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loadOrderForEditing = (orderToEdit) => {
    try {
      const existingItems = orderToEdit.pedido_items.map(item => {
        let notasGuardadas = [];
        // Primero, intentamos decodificar las notas guardadas en la base de datos
        try {
          const parsed = JSON.parse(item.notas);
          if (Array.isArray(parsed)) {
            notasGuardadas = parsed;
          }
        } catch (e) {
          // Si no es un JSON válido (podría ser una nota antigua), pero es un string, lo usamos
          if (typeof item.notas === 'string' && item.notas) {
            notasGuardadas = [item.notas];
          }
        }

        // Segundo, creamos el array 'individuals' usando las notas que recuperamos
        const individualsArray = Array.from({ length: item.cantidad }, (_, index) => ({
          subId: Date.now() + Math.random() + index,
          notas: notasGuardadas[index] || '' // Usamos la nota guardada o un string vacío si no hay una para este item
        }));

        // Finalmente, devolvemos el objeto del producto en el formato correcto para el carrito
        return {
          id: item.producto?.id || item.producto_id,
          nombre: item.producto?.nombre || `Producto ${item.producto_id}`,
          precio: item.precio_unitario,
          categoria: item.producto?.categoria || 'Sin categoría',
          descripcion: item.producto?.descripcion || '',
          stock: item.producto?.stock || 0,
          activo: item.producto?.activo || true,
          orderId: Date.now() + Math.random() + item.id,
          quantity: item.cantidad,
          notas: '', // La nota principal ya no es relevante aquí
          individuals: individualsArray // Asignamos el array correcto con las notas recuperadas
        };
      });

      setCurrentOrder(existingItems);
      setTableNumber(orderToEdit.mesa);
      setEditingOrderId(orderToEdit.id);

      return { success: true };
    } catch (err) {
      setError('Error al cargar pedido para edición');
      return { success: false, error: err.message };
    }
  };

  const clearCurrentOrder = () => {
    setCurrentOrder([]);
    setTableNumber('');
    setEditingOrderId(null);
    setError(null);
  };

  const getTotalPrice = () => {
    return currentOrder.reduce((total, item) => total + (item.precio * item.quantity), 0);
  };

  const getTotalItems = () => {
    return currentOrder.reduce((total, item) => total + item.quantity, 0);
  };
  // 3. Pasamos todos los estados y funciones a través del value del Provider
  const value = {
    currentOrder,
    tableNumber,
    editingOrderId,
    loading,
    error,
    addToOrder,
    removeItemFromOrder,
    updateOrderItem,
    sendOrder,
    loadOrderForEditing,
    clearCurrentOrder,
    setTableNumber,
    setError,
    clearOrderError,
    totalPrice: currentOrder.reduce((total, item) => total + (item.precio * item.quantity), 0),
    totalItems: currentOrder.reduce((total, item) => total + item.quantity, 0),
    isEmpty: currentOrder.length === 0,
    isEditing: editingOrderId !== null
  };

  return <CurrentOrderContext.Provider value={value}>{children}</CurrentOrderContext.Provider>;
};

// 4. Creamos el hook personalizado que consumirá el contexto
export const useCurrentOrder = () => {
  const context = useContext(CurrentOrderContext);
  if (context === undefined) {
    throw new Error('useCurrentOrder must be used within a CurrentOrderProvider');
  }
  return context;
};