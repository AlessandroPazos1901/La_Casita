import React from 'react';

export const Comanda = React.forwardRef(({ order, changes }, ref) => {
  console.log('El componente <Comanda /> se está renderizando con esta orden:', order);
  if (!order) return null;

  const isUpdate = changes && (changes.agregados?.length > 0 || changes.eliminados?.length > 0 || changes.modificados?.length > 0);

  const formatDate = (dateString) => new Date(dateString).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // Función para obtener las notas de un item del pedido
  const getNotes = (item) => {
    if (!item.individuals) return [];
    return item.individuals
      .map(ind => ind.notes || ind.notas)
      .filter(note => note && note.trim() !== '');
  };

  return (
    <div ref={ref} className="p-2 bg-white text-black font-mono" style={{ width: '288px', fontSize: '14px', lineHeight: '1.4' }}>
      <div className="text-center">
        <h1 className="text-xl font-bold">{isUpdate ? '--- ACTUALIZACIÓN ---' : '--- NUEVO PEDIDO ---'}</h1>
      </div>
      <div className="my-2 border-t border-dashed border-black"></div>
      <div className="flex justify-between text-lg font-bold">
        <span>MESA: {order.mesa}</span>
        <span>{formatDate(order.created_at)}</span>
      </div>
      <p className="text-sm">Por: {order.mozo?.nombre || 'Admin'}</p>
      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Si es una actualización, mostramos solo los cambios */}
      {isUpdate ? (
        <div style={{ fontSize: '16px' }}>
          {changes.agregados?.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">AGREGA:</p>
              {changes.agregados.map((item, i) => <p key={`add-${i}`}>- {item.cantidad} {item.nombre}</p>)}
            </div>
          )}
          {changes.eliminados?.length > 0 && (
            <div className="mb-2">
              <p className="font-bold text-red-600">ELIMINA:</p>
              {changes.eliminados.map((item, i) => <p key={`del-${i}`}>- {item.cantidad} {item.nombre}</p>)}
            </div>
          )}
          {changes.modificados?.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">ESPECIFICACIÓN:</p>
              {changes.modificados.map((item, i) => <p key={`mod-${i}`}>- {item.cantidad} {item.nombre}: {item.notas}</p>)}
            </div>
          )}
        </div>
      ) : (
        // Si es un pedido nuevo, mostramos todos los items
        <div>
          {order.pedido_items?.map(item => {
            const notes = getNotes(item);
            return (
              <div key={item.orderId || item.id} className="my-2">
                <p className="font-bold text-lg">{item.quantity} {item.nombre}</p>
                {notes.length > 0 && (
                  <div className="pl-2">
                    {notes.map((nota, idx) => <p key={idx} className="text-xs italic">- {nota}</p>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="my-2 border-t border-dashed border-black"></div>
    </div>
  );
});