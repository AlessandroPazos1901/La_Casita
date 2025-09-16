// ReporteCierreDia.jsx - Componente para imprimir reporte detallado de cierre de día
import React from 'react';

function ReporteCierreDia({ reportData, reportDate }) {
  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (fechaCompleta) => {
    const date = new Date(fechaCompleta);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Procesar productos vendidos con detalles
  const procesarProductosVendidos = () => {
    // Verificar si tenemos datos de resumen diario
    const esResumenDiario = reportData.esResumenDiario;

    if (esResumenDiario && reportData.ingresos.length > 0 && reportData.ingresos[0].resumen_diario) {
      // Usar productos del resumen diario
      const resumen = reportData.ingresos[0].resumen_diario;
      if (resumen.productos_vendidos && resumen.productos_vendidos.length > 0) {
        return resumen.productos_vendidos.sort((a, b) => b.cantidad - a.cantidad);
      }
    }

    // Procesar productos de pedidos normales
    const productosVendidos = {};

    reportData.ingresos.forEach(pedido => {
      if (pedido.pedido_items && pedido.pedido_items.length > 0) {
        pedido.pedido_items.forEach(item => {
          const productoId = item.producto_id;
          const productoNombre = item.producto?.nombre || `Producto ${productoId}`;
          const precio = parseFloat(item.precio_unitario || 0);
          const cantidad = parseInt(item.cantidad || 0);
          const total = precio * cantidad;

          if (!productosVendidos[productoId]) {
            productosVendidos[productoId] = {
              nombre: productoNombre,
              cantidad: 0,
              precioUnitario: precio,
              total: 0
            };
          }

          productosVendidos[productoId].cantidad += cantidad;
          productosVendidos[productoId].total += total;
        });
      }
    });

    // Convertir a array y ordenar por cantidad vendida
    return Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad);
  };

  const productosVendidos = procesarProductosVendidos();

  return (
    <div style={{
      width: '58mm',
      fontFamily: 'monospace',
      fontSize: '10px',
      lineHeight: '1.2',
      color: '#000',
      backgroundColor: '#fff',
      padding: '5mm'
    }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>LA CASITA</div>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>REPORTE CIERRE DE DIA</div>
        <div style={{ fontSize: '10px', marginTop: '2mm' }}>
          {formatearFecha(reportDate)}
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Resumen Financiero */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
          RESUMEN FINANCIERO
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Ingresos:</span>
          <span style={{ fontWeight: 'bold' }}>S/. {reportData.totalIngresos.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Gastos:</span>
          <span style={{ fontWeight: 'bold' }}>S/. {reportData.totalGastos.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid #000', marginTop: '1mm', paddingTop: '1mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Balance Neto:</span>
            <span>S/. {reportData.balanceNeto.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Ingresos por Método de Pago */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
          METODOS DE PAGO
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Efectivo:</span>
          <span>S/. {reportData.ingresosPorOrigen.efectivo.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>POS:</span>
          <span>S/. {reportData.ingresosPorOrigen.pos.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Yape/Plin:</span>
          <span>S/. {reportData.ingresosPorOrigen.yape_plin.toFixed(2)}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Productos Vendidos Detallado */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
          PRODUCTOS VENDIDOS
        </div>
        {productosVendidos.length === 0 ? (
          <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
            No hay productos vendidos
          </div>
        ) : (
          productosVendidos.map((producto, index) => (
            <div key={index} style={{ marginBottom: '2mm' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                {producto.nombre}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '2mm' }}>
                <span>Cantidad:</span>
                <span>{producto.cantidad}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '2mm' }}>
                <span>Precio Unit:</span>
                <span>S/. {producto.precioUnitario.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '2mm', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span>S/. {producto.total.toFixed(2)}</span>
              </div>
              {index < productosVendidos.length - 1 && (
                <div style={{ borderBottom: '1px dotted #ccc', margin: '1mm 0' }}></div>
              )}
            </div>
          ))
        )}
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Resumen de Ventas */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
          RESUMEN DE VENTAS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Pedidos:</span>
          <span>{reportData.esResumenDiario && reportData.ingresos[0]?.resumen_diario ?
            reportData.ingresos[0].resumen_diario.numero_pedidos :
            reportData.ingresos.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Ticket Promedio:</span>
          <span>S/. {(() => {
            const numPedidos = reportData.esResumenDiario && reportData.ingresos[0]?.resumen_diario ?
              reportData.ingresos[0].resumen_diario.numero_pedidos :
              reportData.ingresos.length;
            return numPedidos > 0 ? (reportData.totalIngresos / numPedidos).toFixed(2) : '0.00';
          })()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Productos Vendidos:</span>
          <span>{productosVendidos.reduce((sum, p) => sum + p.cantidad, 0)}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Detalle de Pedidos */}
      <div style={{ marginBottom: '5mm' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
          DETALLE DE PEDIDOS
        </div>
        {reportData.ingresos.length === 0 ? (
          <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
            No hay pedidos registrados
          </div>
        ) : (
          reportData.ingresos.map((pedido, index) => (
            <div key={pedido.id} style={{ marginBottom: '3mm', fontSize: '9px' }}>
              <div style={{ fontWeight: 'bold' }}>
                Pedido #{pedido.numero_pedido || pedido.id} - {formatearHora(pedido.created_at)}
              </div>
              <div style={{ marginLeft: '2mm' }}>
                <div>Mesa: {pedido.mesa || 'N/A'}</div>
                <div>Método: {pedido.metodo_pago || 'efectivo'}</div>
                <div style={{ fontWeight: 'bold' }}>Total: S/. {parseFloat(pedido.total || 0).toFixed(2)}</div>
              </div>
              {index < reportData.ingresos.length - 1 && (
                <div style={{ borderBottom: '1px dotted #ccc', margin: '1mm 0' }}></div>
              )}
            </div>
          ))
        )}
        <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
      </div>

      {/* Gastos */}
      {reportData.gastos.length > 0 && (
        <div style={{ marginBottom: '5mm' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>
            GASTOS DEL DIA
          </div>
          {reportData.gastos.map((gasto, index) => (
            <div key={gasto.id} style={{ marginBottom: '2mm', fontSize: '9px' }}>
              <div style={{ fontWeight: 'bold' }}>{gasto.categoria}</div>
              <div style={{ marginLeft: '2mm' }}>
                <div>{gasto.descripcion}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatearHora(gasto.created_at)}</span>
                  <span style={{ fontWeight: 'bold' }}>S/. {parseFloat(gasto.monto).toFixed(2)}</span>
                </div>
              </div>
              {index < reportData.gastos.length - 1 && (
                <div style={{ borderBottom: '1px dotted #ccc', margin: '1mm 0' }}></div>
              )}
            </div>
          ))}
          <div style={{ borderBottom: '1px dashed #000', margin: '2mm 0' }}></div>
        </div>
      )}

      {/* Pie */}
      <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '5mm' }}>
        <div>Reporte generado el {new Date().toLocaleString('es-ES')}</div>
        <div style={{ marginTop: '2mm' }}>¡Gracias por su gestión!</div>
      </div>
    </div>
  );
}

export default ReporteCierreDia;