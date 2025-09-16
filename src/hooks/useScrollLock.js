// useScrollLock.js - Hook para manejar el bloqueo de scroll en modales
import { useEffect } from 'react';

const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      // Método más simple que no interfiere con el layout
      document.body.style.overflow = 'hidden';
      document.body.classList.add('scroll-lock');
    } else {
      // Restaurar el scroll de manera más suave
      document.body.style.overflow = '';
      document.body.classList.remove('scroll-lock');
    }

    // Cleanup function más simple
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('scroll-lock');
    };
  }, [isLocked]);
};

export default useScrollLock;