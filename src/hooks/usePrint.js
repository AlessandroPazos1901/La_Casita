// hooks/usePrint.js
import { useState, useCallback } from 'react';

const usePrint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // IP del servidor local 
  const PRINT_SERVER_URL = 'https://192.168.1.47:3001'; 
  
  const printOrder = useCallback(async (order, changes = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Enviando pedido a imprimir:', { mesa: order.mesa, changes: !!changes });
      
      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order,
          changes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al imprimir');
      }
      
      const result = await response.json();
      console.log('Pedido impreso correctamente:', result.message);
      
      return result;
    } catch (err) {
      console.error('Error al imprimir pedido:', err);
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
      console.log('Prueba de impresión exitosa:', result.message);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Prueba de impresión exitosa');
      }
      
      return result;
    } catch (err) {
      console.error('Error en prueba de impresión:', err);
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