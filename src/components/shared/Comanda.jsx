import React from 'react';

export const Comanda = React.forwardRef(({ order, changes }, ref) => {
  if (!order) return null;

  const isUpdate = changes && (changes.agregados.length > 0 || changes.eliminados.length > 0 || changes.modificados.length > 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const getNotes = (item) => (item.individuals || []).map(i => i.notes || i.notas).filter(Boolean);

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

      {isUpdate ? (
        <div style={{ fontSize: '16px' }}>
          {changes.agregados.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">AGREGA:</p>
              {changes.agregados.map((item, i) => (
                <div key={`add-${i}`} className="my-1">
                  <p className="text-base">- {item.quantity} {item.nombre}</p>
                  {/* Mostramos las notas si existen */}
                  {item.notas && item.notas.length > 0 && (
                    <div className="pl-4">
                      {item.notas.map((nota, idx) => (
                        <p key={idx} className="text-xs italic">- {nota}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {changes.eliminados.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">ELIMINA:</p>
              {changes.eliminados.map((item, i) => (
                <div key={`del-${i}`} className="my-1">
                  <p className="text-base">- {item.quantity} {item.nombre}</p>
                  {/* Mostramos las notas de los items eliminados si existen */}
                  {item.notas && item.notas.length > 0 && (
                    <div className="pl-4">
                      {item.notas.map((nota, idx) => (
                        <p key={idx} className="text-xs italic">- {nota}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* --- BLOQUE PARA ESPECIFICACIONES (OPCIÓN 2) --- */}
          {changes.modificados.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">ESPECIFICACIÓN:</p>
              {changes.modificados.map((item, i) => {
                const originales = item.especificacionesOriginales || [];
                const nuevas = item.especificacionesNuevas || [];
                
                // Detectamos cambios específicos
                const agregadas = nuevas.filter(spec => !originales.includes(spec));
                const quitadas = originales.filter(spec => !nuevas.includes(spec));
                
                // Creamos mensajes descriptivos de los cambios
                const cambios = [];
                
                if (agregadas.length > 0 && quitadas.length > 0) {
                  // Hay cambios (reemplazos)
                  quitadas.forEach((quitada, idx) => {
                    if (agregadas[idx]) {
                      cambios.push(`${agregadas[idx]} (cambio de "${quitada}")`);
                    }
                  });
                  // Si hay más agregadas que quitadas
                  if (agregadas.length > quitadas.length) {
                    agregadas.slice(quitadas.length).forEach(agregada => {
                      cambios.push(`${agregada} (nueva)`);
                    });
                  }
                } else if (agregadas.length > 0) {
                  // Solo se agregaron especificaciones
                  agregadas.forEach(agregada => {
                    cambios.push(`${agregada} (nueva)`);
                  });
                } else if (quitadas.length > 0) {
                  // Solo se quitaron especificaciones
                  cambios.push(`sin especificaciones (antes: ${quitadas.join(', ')})`);
                }
                
                return (
                  <div key={`mod-${i}`} className="my-1">
                    <p className="text-base">- 1 {item.nombre}:</p>
                    {cambios.map((cambio, idx) => (
                      <p key={idx} className="text-sm italic pl-4">• {cambio}</p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {(order.pedido_items || currentOrder).map(item => { // Usamos currentOrder como fallback
            const notes = getNotes(item);
            return (
              <div key={item.orderId || item.id} className="my-2">
                <p className="font-bold text-lg">{item.quantity} {item.nombre || item.producto?.nombre}</p>
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