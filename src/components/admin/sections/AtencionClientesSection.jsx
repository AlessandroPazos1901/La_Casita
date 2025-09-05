import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';

function AtencionClientesSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

/* This `useEffect` hook in the `AtencionClientesSection` component is responsible for managing the
lifecycle of fetching initial requests, subscribing to real-time changes, and cleaning up the
subscription when the component unmounts. */
  useEffect(() => {
    // 1. Cargar las solicitudes iniciales
    fetchRequests();

    // 2. Escuchar por nuevas solicitudes en tiempo real
    const channel = supabase
      .channel('realtime-atencion-clientes-section')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atencion_clientes' },
        (payload) => {
          // Añadimos la nueva solicitud al principio de la lista
          setRequests(prevRequests => [payload.new, ...prevRequests]);
        }
      )
      .subscribe();

    // 3. Limpiar la suscripción al salir
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

/**
 * The function `fetchRequests` asynchronously fetches data from a table named 'atencion_clientes' and
 * handles loading, error, and setting the retrieved data in a React component.
 */
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('atencion_clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error cargando solicitudes:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const getMotivoStyle = (color) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Cargando solicitudes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-orange-500 pb-2">
        <i className="fas fa-headset text-orange-500 mr-3"></i>Atención al Cliente
      </h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Número</th>
              <th className="py-3 px-6 text-center">Motivo</th>
              <th className="py-3 px-6 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {requests.map(req => (
              <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left font-medium">{req.nombre_cliente || 'N/A'}</td>
                <td className="py-3 px-6 text-left">{req.numero_cliente}</td>
                <td className="py-3 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getMotivoStyle(req.color)}`}>
                    {req.motivo}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">
                  {new Date(req.created_at).toLocaleString('es-PE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p className="text-center text-gray-500 py-8">No hay solicitudes pendientes.</p>}
      </div>
    </div>
  );
}

export default AtencionClientesSection;