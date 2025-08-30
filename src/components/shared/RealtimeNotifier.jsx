import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import useAuth from '../../hooks/useAuth';

const NotificationToast = ({ notification, onClose }) => {
  const { color, nombre_cliente, motivo } = notification;

  const colorClasses = {
    green: 'bg-green-100 border-green-500 text-green-700',
    yellow: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    red: 'bg-red-100 border-red-500 text-red-700',
  };

//   useEffect(() => {
//     // La notificación desaparece después de 10 segundos
//     const timer = setTimeout(onClose, 10000);
//     return () => clearTimeout(timer);
//   }, [onClose]);

  return (
    // p-6 en lugar de p-4 (más padding)
    // text-lg/text-xl (texto más grande)
    // text-xl/text-2xl para títulos
    // ml-6/ml-8 (más espacio entre elementos)
    // text-3xl/text-4xl para el botón de cerrar
    // rounded-xl/rounded-2xl (esquinas más redondeadas)
    <div className={`fixed top-5 right-5 p-6 rounded-lg shadow-lg border-l-4 z-50 text-lg ${colorClasses[color] || 'bg-gray-100'}`}>
        <div className="flex items-center">
            <div className="flex-1">
            <p className="font-bold text-xl mb-2">Nueva Solicitud de Chat</p>
            <p className="text-lg">{nombre_cliente || 'Un cliente'} necesita ayuda por una {motivo}.</p>
            </div>
            <button onClick={onClose} className="ml-6 text-2xl font-bold hover:text-gray-700 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            &times;
            </button>
        </div>
    </div>
  );
};

function RealtimeNotifier() {
  const { isAdmin } = useAuth();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Solo el admin debe recibir notificaciones
    if (!isAdmin) return;

    const channel = supabase
      .channel('realtime-atencion-clientes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atencion_clientes' },
        (payload) => {
          console.log('Nueva solicitud de atención recibida:', payload.new);
          setNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (!notification) return null;

  return <NotificationToast notification={notification} onClose={() => setNotification(null)} />;
}

export default RealtimeNotifier;