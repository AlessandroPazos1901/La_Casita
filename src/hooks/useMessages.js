import { useState, useCallback } from 'react';

const useMessages = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [messageTimeout, setMessageTimeout] = useState(null);

  const showMessage = useCallback((text, type = 'success', duration = 5000) => {
    // Limpiar timeout anterior si existe
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    setMessage(text);
    setMessageType(type);

    // Auto-ocultar mensaje después de la duración especificada
    if (duration > 0) {
      const timeout = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, duration);
      setMessageTimeout(timeout);
    }
  }, [messageTimeout]);

  const showSuccess = useCallback((text, duration = 5000) => {
    showMessage(text, 'success', duration);
  }, [showMessage]);

  const showError = useCallback((text, duration = 5000) => {
    showMessage(text, 'error', duration);
  }, [showMessage]);

  const showInfo = useCallback((text, duration = 5000) => {
    showMessage(text, 'info', duration);
  }, [showMessage]);

  const showWarning = useCallback((text, duration = 5000) => {
    showMessage(text, 'warning', duration);
  }, [showMessage]);

  const hideMessage = useCallback(() => {
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      setMessageTimeout(null);
    }
    setMessage('');
    setMessageType('');
  }, [messageTimeout]);

  const clearMessage = hideMessage; // Alias para hideMessage

  return {
    // Estado
    message,
    messageType,
    hasMessage: message !== '',
    
    // Funciones
    showMessage,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideMessage,
    clearMessage
  };
};

export default useMessages;