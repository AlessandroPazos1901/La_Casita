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

  useEffect(() => {
    // La notificación desaparece después de 10 segundos
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg border-l-4 z-50 ${colorClasses[color] || 'bg-gray-100'}`}>
      <div className="flex items-center">
        <div>
          <p className="font-bold">Nueva Solicitud de Chat</p>
          <p>{nombre_cliente || 'Un cliente'} necesita ayuda por una {motivo}.</p>
        </div>
        <button onClick={onClose} className="ml-4 text-xl font-bold">&times;</button>
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