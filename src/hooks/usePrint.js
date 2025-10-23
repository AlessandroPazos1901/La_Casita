// hooks/usePrint.js
import { useState, useCallback } from 'react';

const usePrint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // IP del servidor local 
  const PRINT_SERVER_URL = import.meta.env.VITE_PRINT_SERVER_URL;
  const PRINT_SERVER_SECRET = import.meta.env.VITE_PRINT_SERVER_SECRET; 
  
  // Función auxiliar para limpiar los datos del pedido
  const cleanOrderData = (order) => {
    // Limpiar items del pedido, manejando dos formatos diferentes:
    // 1. Formato de MenuPage: { nombre, quantity, individuals }
    // 2. Formato de reimpresión: { producto: { nombre }, cantidad, notas }
    const cleanedItems = (order.pedido_items || []).map(item => {
      // Detectar si es formato de reimpresión (viene de la BD)
      const isReprint = item.producto && item.cantidad !== undefined;

      if (isReprint) {
        // Formato de reimpresión desde historial
        let notasArray = [];

        // Las notas vienen como string JSON: "[\"Nota 1\",\"Nota 2\"]"
        if (item.notas) {
          try {
            notasArray = JSON.parse(item.notas);
          } catch (e) {
            // Si no es JSON válido, usar como string simple
            notasArray = [item.notas];
          }
        }

        // Crear individuals basados en la cantidad y notas
        const individuals = [];
        for (let i = 0; i < item.cantidad; i++) {
          individuals.push({
            subId: `reprint-${item.id}-${i}`,
            notas: notasArray[i] || ''
          });
        }

        return {
          nombre: item.producto.nombre,
          quantity: item.cantidad,
          individuals: individuals
        };
      } else {
        // Formato normal desde MenuPage
        return {
          nombre: item.nombre,
          quantity: item.quantity,
          individuals: (item.individuals || []).map(ind => ({
            subId: ind.subId,
            notas: ind.notas || ''
          }))
        };
      }
    });

    // Retornar solo datos esenciales
    return {
      mesa: order.mesa,
      created_at: order.created_at,
      mozo: order.mozo?.nombre || order.mozo || order.atendido_por, // Manejar diferentes fuentes del nombre
      pedido_items: cleanedItems
    };
  };

  // Función auxiliar para limpiar los datos de cambios
  const cleanChangesData = (changes) => {
    if (!changes) return null;

    return {
      agregados: (changes.agregados || []).map(item => ({
        nombre: item.nombre,
        quantity: item.quantity,
        notas: item.notas || []
      })),
      eliminados: (changes.eliminados || []).map(item => ({
        nombre: item.nombre,
        quantity: item.quantity,
        notas: item.notas || []
      })),
      modificados: (changes.modificados || []).map(item => ({
        nombre: item.nombre,
        especificacionesOriginales: item.especificacionesOriginales || [],
        especificacionesNuevas: item.especificacionesNuevas || []
      }))
    };
  };

  const printOrder = useCallback(async (order, changes = null) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!PRINT_SERVER_SECRET) {
        throw new Error('El secreto del servidor de impresión no está configurado.');
      }

      // Limpiar los datos antes de enviar
      const cleanedOrder = cleanOrderData(order);
      const cleanedChanges = cleanChangesData(changes);

      // console.log('📄 Datos limpios a imprimir:', {
      //   mesa: cleanedOrder.mesa,
      //   items: cleanedOrder.pedido_items.length,
      //   hasChanges: !!cleanedChanges
      // });

      // Log detallado de los datos limpios (solo en desarrollo)
      // if (import.meta.env.DEV) {
        // console.log('📦 Payload completo limpio:', JSON.stringify({
      //     order: cleanedOrder,
      //     changes: cleanedChanges
      //   }, null, 2));
      // }

      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PRINT_SERVER_SECRET}`
        },
        body: JSON.stringify({
          order: cleanedOrder,
          changes: cleanedChanges
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al imprimir');
      }
      
      const result = await response.json();
      // // console.log('Pedido impreso correctamente:', result.message);
      
      return result;
    } catch (err) {
      // console.error('Error al imprimir pedido:', err);
      setError(err.message);
      
      // Opcional: mostrar notificación al usuario
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Error de impresión: ${err.message}`);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [PRINT_SERVER_URL]);
  
  const testPrint = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${PRINT_SERVER_URL}/test-print`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en prueba de impresión');
      }
      
      const result = await response.json();
      // // console.log('Prueba de impresión exitosa:', result.message);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Prueba de impresión exitosa');
      }
      
      return result;
    } catch (err) {
      // console.error('Error en prueba de impresión:', err);
      setError(err.message);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Error en prueba: ${err.message}`);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [PRINT_SERVER_URL]);
  
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${PRINT_SERVER_URL}/test`);
      return response.ok;
    } catch (err) {
      return false;
    }
  }, [PRINT_SERVER_URL]);
  
  return {
    printOrder,
    testPrint,
    checkServerStatus,
    isLoading,
    error
  };
};

export default usePrint;