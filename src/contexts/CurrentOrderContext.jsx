import React, { createContext, useContext, useState } from 'react';
import useMenuItems from '../hooks/useMenuItems';
import useOrderHistory from '../hooks/useOrderHistory';
import { useAuth } from './AuthContext';
// 1. Creamos el contexto
const CurrentOrderContext = createContext();

// 2. Creamos el Provider, que contendrá toda la lógica
export const CurrentOrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalOrderItems, setOriginalOrderItems] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { profile, userRole } = useAuth();

  // Función para cargar el carrito desde localStorage
  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('currentOrder');
      const savedTableNumber = localStorage.getItem('tableNumber');
      const savedEditingOrderId = localStorage.getItem('editingOrderId');
      
      // console.log('Loading from localStorage:', { savedCart, savedTableNumber, savedEditingOrderId });
      
      if (savedCart && savedCart !== '[]') {
        const parsedCart = JSON.parse(savedCart);
        // console.log('Parsed cart:', parsedCart);
        setCurrentOrder(parsedCart);
      }
      
      if (savedTableNumber && savedTableNumber !== '') {
        setTableNumber(savedTableNumber);
      }
      
      if (savedEditingOrderId && savedEditingOrderId !== 'null') {
        setEditingOrderId(parseInt(savedEditingOrderId));
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Si hay error, limpiar localStorage
      localStorage.removeItem('currentOrder');
      localStorage.removeItem('tableNumber');
      localStorage.removeItem('editingOrderId');
      setIsInitialized(true);
    }
  };

  // Función para guardar el carrito en localStorage
  const saveCartToStorage = (order, table, editingId) => {
    if (!isInitialized) return; // No guardar hasta que se haya inicializado
    
    try {
      // console.log('Saving to localStorage:', { order, table, editingId });
      localStorage.setItem('currentOrder', JSON.stringify(order));
      localStorage.setItem('tableNumber', table);
      localStorage.setItem('editingOrderId', editingId ? editingId.toString() : 'null');
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Cargar el carrito al inicializar el contexto
  React.useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Guardar el carrito cada vez que cambie (solo después de inicializar)
  React.useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(currentOrder, tableNumber, editingOrderId);
    }
  }, [currentOrder, tableNumber, editingOrderId, isInitialized]);

  // Recuperar items originales del localStorage al inicializar
  React.useEffect(() => {
    if (editingOrderId && !originalOrderItems) {
      const savedOriginalItems = localStorage.getItem('editing_original_items');
      if (savedOriginalItems) {
        try {
          setOriginalOrderItems(JSON.parse(savedOriginalItems));
        } catch (e) {
          console.error('Error parsing saved original items:', e);
        }
      }
    }
  }, [editingOrderId, originalOrderItems]);
  
  const { decrementStock, incrementStock, adjustStock } = useMenuItems();
  const { 
    createOrder, 
    insertOrderItems, 
    updateOrder, 
    getOrderItems, 
    deleteOrderItems,
    refreshOrderHistory 
  } = useOrderHistory(profile?.id, userRole);
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
      // console.log('Pedido creado/actualizado, refrescando historial...');
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
        usuario_id: profile?.id || null,
        atendido_por: profile?.nombre || 'Sistema',
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
  const calcularCambiosPedido = (original, nuevo) => {
      const cambios = { agregados: [], eliminados: [], modificados: [] };

      // Agrupamos por ID de producto para contar las cantidades
      const originalGrouped = (original || []).reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + item.quantity;
        return acc;
      }, {});
      const nuevoGrouped = (nuevo || []).reduce((acc, item) => {
        acc[item.id] = (acc[item.id] || 0) + item.quantity;
        return acc;
      }, {});

      // También agrupamos los items completos por ID para comparar especificaciones
      const originalItems = (original || []).reduce((acc, item) => {
        if (!acc[item.id]) acc[item.id] = [];
        acc[item.id].push(item);
        return acc;
      }, {});
      const nuevoItems = (nuevo || []).reduce((acc, item) => {
        if (!acc[item.id]) acc[item.id] = [];
        acc[item.id].push(item);
        return acc;
      }, {});

      const allProductIds = new Set([...Object.keys(originalGrouped).map(Number), ...Object.keys(nuevoGrouped).map(Number)]);

      allProductIds.forEach(productId => {
        const originalQty = originalGrouped[productId] || 0;
        const newQty = nuevoGrouped[productId] || 0;
        const diff = newQty - originalQty;

        if (diff > 0) {
          // Se agregaron items
          const productInfo = (nuevo || []).find(item => item.id == productId);
        
          // Obtenemos las notas de los últimos 'diff' items individuales, que son los nuevos
          const addedNotes = (productInfo.individuals || [])
            .slice(-diff) // Tomamos los últimos N elementos del array
            .map(ind => ind.notes || ind.notas) // Obtenemos la nota de cada uno
            .filter(note => note && note.trim() !== ''); // Filtramos las que estén vacías

          cambios.agregados.push({ ...productInfo, quantity: diff, notas: addedNotes });

          // TAMBIÉN verificamos si hubo cambios en las especificaciones de los items existentes
          if (originalQty > 0) {
            const originalItemsForProduct = originalItems[productId] || [];
            const nuevoItemsForProduct = nuevoItems[productId] || [];
            
            // Recolectamos especificaciones de los items que ya existían (no los nuevos)
            const originalSpecs = [];
            const nuevasSpecs = [];
            
            originalItemsForProduct.forEach(item => {
              (item.individuals || []).forEach(ind => {
                const nota = ind.notes || ind.notas || '';
                originalSpecs.push(nota.trim());
              });
            });
            
            // Para las nuevas especificaciones, tomamos solo las de los items existentes (no los nuevos)
            nuevoItemsForProduct.forEach(item => {
              const individualsExistentes = (item.individuals || []).slice(0, originalQty); // Solo los primeros (existentes)
              individualsExistentes.forEach(ind => {
                const nota = ind.notes || ind.notas || '';
                nuevasSpecs.push(nota.trim());
              });
            });
            
            // Ordenamos para comparar correctamente
            originalSpecs.sort();
            nuevasSpecs.sort();
            
            // Verificamos si hay diferencias en los items existentes
            const hayChanges = originalSpecs.length !== nuevasSpecs.length || 
                              originalSpecs.some((spec, index) => spec !== nuevasSpecs[index]);
            
            if (hayChanges) {
              const productInfo = nuevoItemsForProduct[0];
              cambios.modificados.push({
                ...productInfo,
                quantity: originalQty, // Cantidad de los items que se modificaron
                especificacionesOriginales: originalSpecs,
                especificacionesNuevas: nuevasSpecs
              });
            }
          }

        } else if (diff < 0) {
          // Se eliminaron items
          const productInfo = (original || []).find(item => item.id == productId);
          
          // Obtenemos las especificaciones de los items eliminados
          const eliminatedNotes = (productInfo.individuals || [])
            .slice(diff) // Tomamos los últimos N elementos que fueron eliminados (diff es negativo)
            .map(ind => ind.notes || ind.notas) // Obtenemos la nota de cada uno
            .filter(note => note && note.trim() !== ''); // Filtramos las que estén vacías
          
          cambios.eliminados.push({ ...productInfo, quantity: -diff, notas: eliminatedNotes });
          
          // TAMBIÉN verificamos si hubo cambios en las especificaciones de los items que quedaron
          if (newQty > 0) {
            const originalItemsForProduct = originalItems[productId] || [];
            const nuevoItemsForProduct = nuevoItems[productId] || [];
            
            // Recolectamos especificaciones de los items que quedaron
            const originalSpecs = [];
            const nuevasSpecs = [];
            
            // Para las especificaciones originales, tomamos solo las de los items que NO se eliminaron
            originalItemsForProduct.forEach(item => {
              const individualsQueQuedan = (item.individuals || []).slice(0, newQty); // Solo los primeros (que quedaron)
              individualsQueQuedan.forEach(ind => {
                const nota = ind.notes || ind.notas || '';
                originalSpecs.push(nota.trim());
              });
            });
            
            // Para las nuevas especificaciones, tomamos todas las que hay ahora
            nuevoItemsForProduct.forEach(item => {
              (item.individuals || []).forEach(ind => {
                const nota = ind.notes || ind.notas || '';
                nuevasSpecs.push(nota.trim());
              });
            });
            
            // Ordenamos para comparar correctamente
            originalSpecs.sort();
            nuevasSpecs.sort();
            
            // Verificamos si hay diferencias en los items que quedaron
            const hayChanges = originalSpecs.length !== nuevasSpecs.length || 
                              originalSpecs.some((spec, index) => spec !== nuevasSpecs[index]);
            
            if (hayChanges) {
              const productInfo = nuevoItemsForProduct[0];
              cambios.modificados.push({
                ...productInfo,
                quantity: newQty, // Cantidad de los items que quedaron
                especificacionesOriginales: originalSpecs,
                especificacionesNuevas: nuevasSpecs
              });
            }
          }
        
        } else if (diff === 0 && originalQty > 0) {
          // Misma cantidad, verificamos si hay cambios en especificaciones
          const originalItemsForProduct = originalItems[productId] || [];
          const nuevoItemsForProduct = nuevoItems[productId] || [];
          
          // Recolectamos todas las especificaciones originales y nuevas
          const originalSpecs = [];
          const nuevasSpecs = [];
          
          originalItemsForProduct.forEach(item => {
            (item.individuals || []).forEach(ind => {
              const nota = ind.notes || ind.notas || '';
              originalSpecs.push(nota.trim());
            });
          });
          
          nuevoItemsForProduct.forEach(item => {
            (item.individuals || []).forEach(ind => {
              const nota = ind.notes || ind.notas || '';
              nuevasSpecs.push(nota.trim());
            });
          });
          
          // Ordenamos para comparar correctamente
          originalSpecs.sort();
          nuevasSpecs.sort();
          
          // Verificamos si hay diferencias
          const hayChanges = originalSpecs.length !== nuevasSpecs.length || 
                            originalSpecs.some((spec, index) => spec !== nuevasSpecs[index]);
          
          if (hayChanges) {
            const productInfo = nuevoItemsForProduct[0]; // Tomamos info del primer item
            cambios.modificados.push({
              ...productInfo,
              especificacionesOriginales: originalSpecs,
              especificacionesNuevas: nuevasSpecs
            });
          }
        }
      });

      return cambios;
  };

  const updateExistingOrder = async (orderId, total) => {
    // console.log("Datos en currentOrder ANTES de actualizar:", JSON.stringify(currentOrder, null, 2));
    // console.log("Items originales guardados:", JSON.stringify(originalOrderItems, null, 2));
    
    try {
      // NO hacer ajustes de stock aquí - ya se ajustaron cuando se agregaron/eliminaron productos
      // console.log("⚠️ IMPORTANTE: No se ajustará stock - ya fue ajustado al agregar/eliminar productos");

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

      // console.log("✅ Pedido actualizado sin ajustar stock (ya fue ajustado previamente)");

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
      setOriginalOrderItems(JSON.parse(JSON.stringify(existingItems)));
      // Guardar en localStorage para persistir durante la navegación
      localStorage.setItem('editing_original_items', JSON.stringify(existingItems));
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
    setOriginalOrderItems(null);
    localStorage.removeItem('editing_original_items');
    localStorage.removeItem('currentOrder');
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('editingOrderId');
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
    originalOrderItems,
    loading,
    error,
    addToOrder,
    removeItemFromOrder,
    updateOrderItem,
    sendOrder,
    calcularCambiosPedido ,
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