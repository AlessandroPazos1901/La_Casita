import { useContext } from 'react';
// Importa el contexto que creaste en el paso 1
// Asegúrate de que la ruta sea correcta
import { CurrentOrderContext } from '../contexts/CurrentOrderContext';

export const useCurrentOrder = () => {
  const context = useContext(CurrentOrderContext);
  if (context === undefined) {
    throw new Error('useCurrentOrder must be used within a CurrentOrderProvider');
  }
  return context;
};
