import React from 'react';

export const BoletaTermica = React.forwardRef(({ order }, ref) => {
  // Siempre renderizar el div contenedor, incluso si no hay orden

  return (
    <div 
      ref={ref} 
      className="p-2 bg-white text-black font-mono" 
      style={{ 
        width: '288px', 
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      {!order ? (
        <div>No hay datos de orden</div>
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-lg font-bold">La Casita Restaurant</h1>
            <p>Huanuco, Peru</p>
            <p>Boleta de Venta Electrónica</p>
          </div>
          <div className="my-2 border-t border-dashed border-black"></div>
          <p><strong>Mesa:</strong> {order.mesa}</p>
          <p><strong>Pedido:</strong> {order.numero_pedido}</p>
          <p><strong>Fecha:</strong> {formatDate(order.created_at)}</p>
          <p><strong>Atendido por:</strong> {order.mozo?.nombre || 'Admin'}</p>
          <p><strong>Cliente:</strong> {order.mesa.split(',').last() || ''}</p>
          <p><strong>Celular:</strong> {order.celular || ''}</p>
          <p><strong>Direccion:</strong> {order.direccion || ''}</p>
          <div className="my-2 border-t border-dashed border-black"></div>
          
          <div className="flex justify-between font-bold">
            <span className="w-1/6">Cant.</span>
            <span className="flex-1">Producto</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          <div className="my-1 border-t border-dashed border-black"></div>

          {order.pedido_items?.map((item, index) => (
            <div key={item.id || index} className="flex justify-between my-1">
              <span className="w-1/6">{item.cantidad}</span>
              <span className="flex-1">{item.producto?.nombre || 'Producto'}</span>
              <span className="w-1/4 text-right">
                S/.{(item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
            </div>
          ))}
          {order.delivery > 0.01 && (
            <div className="flex justify-between my-1">
              <span className="w-1/6">1</span>
              <span className="flex-1">Delivery</span>
              <span className="w-1/4 text-right">S/.{order.delivery}</span>
            </div>
          )}
          
          <div className="my-2 border-t border-dashed border-black"></div>
          <div className="flex flex-col items-end">
            <div className="flex justify-between w-full">
              <span>Subtotal:</span>
              <span>S/. {parseFloat(order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full font-bold text-lg">
              <span>TOTAL:</span>
              <span>S/. {parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
          <div className="my-2 border-t border-dashed border-black"></div>
          <p><strong>Pago con:</strong> {paymentMethodText[order.metodo_pago] || 'No especificado'}</p>
          <div className="text-center mt-4">
            <p>¡Gracias por su visita!</p>
          </div>
        </>
      )}
    </div>
  );
});

// Nombre para debugging
BoletaTermica.displayName = 'BoletaTermica';

// Función auxiliar dentro del componente
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-PE', {
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
};

const paymentMethodText = {
  efectivo: 'Efectivo',
  pos: 'Tarjeta (POS)',
  yape_plin: 'Yape/Plin'
};