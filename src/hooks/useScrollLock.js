// useScrollLock.js - Hook para manejar el bloqueo de scroll en modales
import { useEffect } from 'react';

const useScrollLock = (isLocked) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalWidth = window.getComputedStyle(document.body).width;

    if (isLocked) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;

      // Aplicar el lock
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Agregar clase para identificación
      document.body.classList.add('scroll-lock');
    } else {
      // Restaurar el scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = originalWidth;

      // Remover clase
      document.body.classList.remove('scroll-lock');

      // Restaurar la posición del scroll
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = originalWidth;
      document.body.classList.remove('scroll-lock');
    };
  }, [isLocked]);
};

export default useScrollLock;