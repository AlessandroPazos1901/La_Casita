import React from 'react';
import useMenuItems from '../../hooks/useMenuItems';

const RealtimeStatus = () => {
  const { isRealtimeConnected, connectionHealth, lastHeartbeat } = useMenuItems();
  
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;
  
  const health = connectionHealth();
  const timeSinceHeartbeat = Math.floor((Date.now() - lastHeartbeat) / 1000);
  
  const getStatusColor = () => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'stale': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusText = () => {
    switch (health) {
      case 'healthy': return 'Conectado';
      case 'warning': return 'Conexión lenta';
      case 'stale': return 'Conexión obsoleta';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconocido';
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-3 border">
      <div className="flex items-center space-x-2 text-sm">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="font-medium">Realtime:</span>
        <span>{getStatusText()}</span>
      </div>
      {isRealtimeConnected && (
        <div className="text-xs text-gray-500 mt-1">
          Último heartbeat: {timeSinceHeartbeat}s
        </div>
      )}
    </div>
  );
};

export default RealtimeStatus;