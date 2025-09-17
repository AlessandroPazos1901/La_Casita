// ReporteDiaSection.jsx
import React, { useState, useEffect } from 'react';
// import useDashboard from '../../../hooks/useDashboard';
import { useDataCache } from '../../../contexts/DataCacheContext';
import { supabase } from '../../../services/supabaseClient';
import ReporteCierreDia from '../../shared/ReporteCierreDia';
import useScrollLock from '../../../hooks/useScrollLock';

function ReporteDiaSection() {
  const { getFreshDailyData, 
    refreshCache ,
    isLoading: initialLoading 
  } = useDataCache();
  const today = new Date().toLocaleDateString('en-CA');;
  
  const [reportDate, setReportDate] = useState(today);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Hook para manejar el scroll lock cuando se abre el modal
  useScrollLock(showPrintModal);

  const [dailyData, setDailyData] = useState({
    ingresos: [],
    gastos: [],
    totalIngresos: 0,
    totalGastos: 0,
    balanceNeto: 0,
    ingresosPorOrigen: { efectivo: 0, pos: 0, yape_plin: 0 }
  });
  // Función para imprimir reporte de cierre
  const handleImprimirCierre = () => {
    setShowPrintModal(true);
  };

  // Función para el cierre del dia
  const handleCerrarDia = async () => {
    // Primero mostrar el reporte de impresión
    const imprimirPrimero = window.confirm(
      `💡 ¿Deseas imprimir el reporte detallado antes de cerrar el día?\n\nEsto te permitirá revisar todos los detalles de ventas antes del cierre definitivo.`
    );

    if (imprimirPrimero) {
      setShowPrintModal(true);
      return;
    }

    const confirmation = window.confirm(
      `⚠️ ADVERTENCIA ⚠️\n\nEstás a punto de cerrar el día ${reportDate}. Esto guardará un resumen de las ventas y borrará permanentemente todos los pedidos de esta fecha.\n\nEsta acción no se puede deshacer.\n\n¿Estás seguro de que quieres continuar?`
    );

    if (confirmation) {
      setIsClosing(true);
      try {
        const { error } = await supabase.rpc('cerrar_dia', {
          report_date: reportDate,
        });

        if (error) {
          throw error;
        }

        alert('¡Día cerrado con éxito! Se ha guardado el resumen y borrado el historial de pedidos del día.');
        // Refrescamos todos los datos de la aplicación
        refreshCache();
      } catch (error) {
        alert(`Error al cerrar el día: ${error.message}`);
      } finally {
        setIsClosing(false);
      }
    }
  };

  // Función para confirmar el cierre después de imprimir
  const confirmarCierreDespuesDeImprimir = async () => {
    setShowPrintModal(false);

    const confirmation = window.confirm(
      `⚠️ ADVERTENCIA ⚠️\n\nAhora procederemos con el cierre del día ${reportDate}. Esto guardará un resumen de las ventas y borrará permanentemente todos los pedidos de esta fecha.\n\nEsta acción no se puede deshacer.\n\n¿Estás seguro de que quieres continuar?`
    );

    if (confirmation) {
      setIsClosing(true);
      try {
        const { error } = await supabase.rpc('cerrar_dia', {
          report_date: reportDate,
        });

        if (error) {
          throw error;
        }

        alert('¡Día cerrado con éxito! Se ha guardado el resumen y borrado el historial de pedidos del día.');
        // Refrescamos todos los datos de la aplicación
        refreshCache();
      } catch (error) {
        alert(`Error al cerrar el día: ${error.message}`);
      } finally {
        setIsClosing(false);
      }
    }
  };
  // Función mejorada para obtener datos del día seleccionado
  const loadDailyData = () => {
    // Crear fechas sin problemas de zona horaria
    const fechaSeleccionada = new Date(reportDate + 'T00:00:00');
    const fechaSeleccionadaStr = fechaSeleccionada.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Obtener ventas del día
    const ventasDelDia = ventas.filter(venta => {
      const fechaVenta = new Date(venta.created_at);
      const fechaVentaStr = fechaVenta.toLocaleDateString('en-CA'); // YYYY-MM-DD
      return fechaVentaStr === fechaSeleccionadaStr && venta.estado === 'pagado';
    });

    // Obtener gastos del día
    const gastosDelDia = gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha + 'T00:00:00');
      const fechaGastoStr = fechaGasto.toLocaleDateString('en-CA'); // YYYY-MM-DD
      return fechaGastoStr === fechaSeleccionadaStr;
    });

    // Calcular totales
    const totalIngresos = ventasDelDia.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
    const totalGastos = gastosDelDia.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
    const balanceNeto = totalIngresos - totalGastos;

    // Categorizar ingresos por origen
    const ingresosPorOrigen = { efectivo: 0, pos: 0, yape_plin: 0 };

    ventasDelDia.forEach(venta => {
      const metodo = venta.metodo_pago || 'efectivo';
      // Mapear los orígenes a los nuevos métodos de pago
      if (metodo === 'efectivo') {
        ingresosPorOrigen.efectivo += parseFloat(venta.total || 0);
      } else if (metodo === 'pos') {
        ingresosPorOrigen.pos += parseFloat(venta.total || 0);
      } else if (metodo === 'yape_plin') {
        ingresosPorOrigen.yape_plin += parseFloat(venta.total || 0);
      } 
    });

    setDailyData({
      ingresos: ventasDelDia,
      gastos: gastosDelDia,
      totalIngresos,
      totalGastos,
      balanceNeto,
      ingresosPorOrigen
    });
  };

  // Función para procesar productos vendidos
  const procesarProductosVendidos = (ventas, esResumenDiario) => {
    if (esResumenDiario && ventas.length > 0 && ventas[0].resumen_diario) {
      // Usar productos del resumen diario (datos históricos)
      const resumen = ventas[0].resumen_diario;
      if (resumen.productos_vendidos && resumen.productos_vendidos.length > 0) {
        return resumen.productos_vendidos.sort((a, b) => b.cantidad - a.cantidad);
      }
    }

    // Procesar productos de pedidos normales (día actual)
    const productosVendidos = {};

    ventas.forEach(venta => {
      if (venta.pedido_items && venta.pedido_items.length > 0) {
        venta.pedido_items.forEach(item => {
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

  // Cargar datos cuando cambie la fecha o los datos del dashboard
  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtenemos los datos frescos para la fecha seleccionada
        const { ventas, gastos } = await getFreshDailyData(reportDate);

        // Verificar si tenemos datos de resumen diario (día cerrado)
        const esResumenDiario = ventas.length > 0 && ventas[0].resumen_diario;

        let totalIngresos = 0;
        let ingresosPorOrigen = { efectivo: 0, pos: 0, yape_plin: 0 };

        if (esResumenDiario) {
          // Datos de día cerrado - usar resumen diario
          const resumen = ventas[0].resumen_diario;
          totalIngresos = parseFloat(ventas[0].total || 0);
          ingresosPorOrigen = {
            efectivo: resumen.ingresos_efectivo || 0,
            pos: resumen.ingresos_pos || 0,
            yape_plin: resumen.ingresos_yape_plin || 0
          };

          // Para días cerrados, usar los pedidos detallados del resumen si están disponibles
          if (resumen.pedidos_detalle && resumen.pedidos_detalle.length > 0) {
            ventas.splice(0, 1, ...resumen.pedidos_detalle.map(pedido => ({
              ...pedido,
              es_historico: true // Marcador para identificar datos históricos
            })));
          }
        } else {
          // Datos del día actual - calcular normalmente
          totalIngresos = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);

          ventas.forEach(venta => {
            const metodo = venta.metodo_pago;
            if (metodo === 'efectivo') {
              ingresosPorOrigen.efectivo += parseFloat(venta.total || 0);
            } else if (metodo === 'pos') {
              ingresosPorOrigen.pos += parseFloat(venta.total || 0);
            } else if (metodo === 'yape_plin') {
              ingresosPorOrigen.yape_plin += parseFloat(venta.total || 0);
            }
          });
        }

        const totalGastos = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
        const balanceNeto = totalIngresos - totalGastos;

        // Procesar productos vendidos para mostrar en el reporte
        const productosVendidos = procesarProductosVendidos(ventas, esResumenDiario);

        setDailyData({
          ingresos: ventas,
          gastos: gastos,
          totalIngresos,
          totalGastos,
          balanceNeto,
          ingresosPorOrigen,
          esResumenDiario, // Añadir esta bandera para saber si son datos históricos
          productosVendidos // Añadir productos procesados
        });

      } catch (err) {
        setError(err.message);
        console.error('Error al cargar reporte del día:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [reportDate, getFreshDailyData]); // Dependemos de la fecha y la función

  // Estados de carga
  if (initialLoading || loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <div className="ml-4 text-lg text-gray-600">Cargando datos del reporte...</div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
      <div className="flex items-center">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        <strong>Error:</strong> {error}
      </div>
    </div>
  );

  // Función para formatear fecha de manera legible
  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear hora
  const formatearHora = (fechaCompleta) => {
    const date = new Date(fechaCompleta);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Determinar si es el día actual
  const esHoy = reportDate === today;
  const fechaFutura = new Date(reportDate) > new Date();

  return (
    <div className="bg-white responsive-padding md:p-8 rounded-lg shadow-xl w-full max-w-full overflow-x-hidden full-width-container">
      <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-6 md:mb-8 border-b-4 border-orange-500 pb-2">
        <i className="fas fa-calendar-day text-orange-500 mr-2 md:mr-3"></i>
        <span className="block sm:inline">Reporte del Día</span>
      </h1>
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleImprimirCierre}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
        >
          🖨️ Imprimir Reporte Detallado
        </button>
        {/* Solo mostrar botón de cerrar día para el día actual */}
        {esHoy && !dailyData.esResumenDiario && (
          <button
            onClick={handleCerrarDia}
            disabled={isClosing}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-wait transition-colors duration-200"
          >
            {isClosing ? 'Cerrando...' : '🔒 Cerrar Día'}
          </button>
        )}
      </div>
      {/* Selector de fecha mejorado */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="reportDate" className="block text-gray-700 text-sm font-bold mb-2">
              Seleccionar Fecha del Reporte
            </label>
            <input
              type="date"
              id="reportDate"
              value={reportDate}
              max={today} // No permitir fechas futuras
              onChange={(e) => setReportDate(e.target.value)}
              className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setReportDate(today)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                esHoy 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
                setReportDate(yesterdayStr);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
            >
              Ayer
            </button>
          </div>
        </div>
        
        {/* Mostrar fecha seleccionada */}
        <div className="mt-4 p-3 bg-white rounded border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Reporte para:</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">
            {formatearFecha(reportDate)}
            {esHoy && !dailyData.esResumenDiario && <span className="ml-2 text-sm text-green-600 font-normal">(Hoy - Día Activo)</span>}
            {esHoy && dailyData.esResumenDiario && <span className="ml-2 text-sm text-blue-600 font-normal">(Hoy - Día Cerrado)</span>}
            {!esHoy && dailyData.esResumenDiario && <span className="ml-2 text-sm text-blue-600 font-normal">(Día Cerrado - Datos Históricos)</span>}
            {fechaFutura && <span className="ml-2 text-sm text-red-600 font-normal">(Fecha futura - no disponible)</span>}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {fechaFutura && (
        <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Nota:</strong> No se pueden mostrar datos de fechas futuras.
          </div>
        </div>
      )}

      {/* Resumen del día */}
      <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-inner border border-blue-200">
        <h2 className="text-2xl font-semibold text-blue-800 mb-6 flex items-center">
          <i className="fas fa-chart-line mr-3"></i>
          Resumen Financiero - {formatearFecha(reportDate)}
        </h2>
        
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Ingresos Totales</h3>
            <p className="text-2xl font-bold text-green-600">
              S/. {dailyData.totalIngresos.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dailyData.ingresos.length} {dailyData.ingresos.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Gastos Totales</h3>
            <p className="text-2xl font-bold text-red-600">
              S/. {dailyData.totalGastos.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dailyData.gastos.length} {dailyData.gastos.length === 1 ? 'gasto' : 'gastos'}
            </p>
          </div>
          
          <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${
            dailyData.balanceNeto >= 0 ? 'border-blue-500' : 'border-orange-500'
          }`}>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Balance Neto</h3>
            <p className={`text-2xl font-bold ${
              dailyData.balanceNeto >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              S/. {dailyData.balanceNeto.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dailyData.balanceNeto >= 0 ? 'Ganancia' : 'Pérdida'}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Ticket Promedio</h3>
            <p className="text-2xl font-bold text-purple-600">
              S/. {dailyData.ingresos.length > 0 ? (dailyData.totalIngresos / dailyData.ingresos.length).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Por pedido</p>
          </div>
        </div>

        {/* Ingresos por origen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-blue-700 mb-3 flex items-center">
              <i className="fas fa-credit-card mr-2"></i>
              Ingresos por Método de Pago
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Efectivo:</span>
                <span className="font-semibold text-gray-800">
                  S/. {dailyData.ingresosPorOrigen.efectivo.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">POS:</span>
                <span className="font-semibold text-gray-800">
                  S/. {dailyData.ingresosPorOrigen.pos.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Yape/Plin:</span>
                <span className="font-semibold text-gray-800">
                  S/. {dailyData.ingresosPorOrigen.yape_plin.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-green-700 mb-3 flex items-center">
              <i className="fas fa-percentage mr-2"></i>
              Distribución de Pagos
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Efectivo:</span>
                <span className="font-semibold text-gray-800">
                  {dailyData.totalIngresos > 0 ? 
                    ((dailyData.ingresosPorOrigen.efectivo / dailyData.totalIngresos) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">POS:</span>
                <span className="font-semibold text-gray-800">
                  {dailyData.totalIngresos > 0 ? 
                    ((dailyData.ingresosPorOrigen.pos / dailyData.totalIngresos) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Yape/Plin:</span>
                <span className="font-semibold text-gray-800">
                  {dailyData.totalIngresos > 0 ? 
                    ((dailyData.ingresosPorOrigen.yape_plin / dailyData.totalIngresos) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabla de Gastos */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
          <i className="fas fa-money-bill-wave text-red-600 mr-3"></i>
          Gastos del Día ({dailyData.gastos.length} gastos)
        </h2>
        {dailyData.gastos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <i className="fas fa-piggy-bank text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-500 text-lg">No hay gastos registrados para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md responsive-table">
              <thead>
                <tr className="bg-red-200 text-red-800 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left rounded-tl-lg">Categoría</th>
                  <th className="py-3 px-6 text-left">Descripción</th>
                  <th className="py-3 px-6 text-left">Hora</th>
                  <th className="py-3 px-6 text-left rounded-tr-lg">Monto</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {dailyData.gastos.map((gasto) => (
                  <tr key={gasto.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3 px-6 text-left">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">{gasto.descripcion}</td>
                    <td className="py-3 px-6 text-left">
                      {gasto.created_at ? formatearHora(gasto.created_at) : '-'}
                    </td>
                    <td className="py-3 px-6 text-left font-semibold text-red-600">
                      S/. {parseFloat(gasto.monto).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Productos Vendidos */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
          <i className="fas fa-utensils text-green-600 mr-3"></i>
          Productos Vendidos ({dailyData.productosVendidos?.length || 0} productos)
        </h2>
        {!dailyData.productosVendidos || dailyData.productosVendidos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <i className="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
            <p className="text-gray-500 text-lg">No hay productos vendidos para esta fecha.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="min-w-full w-full responsive-table">
                <thead className="bg-green-200 text-green-800">
                  <tr className="uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left rounded-tl-lg">#</th>
                    <th className="py-3 px-6 text-left">Producto</th>
                    <th className="py-3 px-6 text-center">Cantidad</th>
                    <th className="py-3 px-6 text-center">Precio Unit.</th>
                    <th className="py-3 px-6 text-center rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {dailyData.productosVendidos.map((producto, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-3 px-6 text-left">
                        <span className="font-bold text-gray-800">#{index + 1}</span>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <div className="flex items-center">
                          <i className="fas fa-utensils text-green-500 mr-2"></i>
                          <span className="font-medium text-gray-800">{producto.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-medium">
                          {producto.cantidad}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-semibold text-gray-800">
                        S/. {producto.precioUnitario.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-center font-bold text-green-600">
                        S/. {producto.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr className="font-bold text-gray-800">
                    <td colSpan="2" className="py-3 px-6 text-right">TOTALES:</td>
                    <td className="py-3 px-6 text-center">
                      <span className="bg-blue-600 text-white py-1 px-3 rounded-full text-sm">
                        {dailyData.productosVendidos.reduce((sum, p) => sum + p.cantidad, 0)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">-</td>
                    <td className="py-3 px-6 text-center text-green-600 font-bold text-lg">
                      S/. {dailyData.productosVendidos.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Gráfica de barras visual */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                <i className="fas fa-chart-bar text-blue-500 mr-2"></i>
                Distribución Visual
              </h3>
              <div className="space-y-3">
                {dailyData.productosVendidos.slice(0, 10).map((producto, index) => {
                  const maxCantidad = dailyData.productosVendidos[0]?.cantidad || 1;
                  const porcentaje = (producto.cantidad / maxCantidad) * 100;

                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-32 text-sm font-medium text-gray-700 truncate">
                        {producto.nombre}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${Math.max(porcentaje, 5)}%` }}
                        >
                          <span className="text-white text-xs font-bold">
                            {producto.cantidad}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 text-sm font-semibold text-gray-600 text-right">
                        S/. {producto.total.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Impresión */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 1000 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                📄 Reporte Detallado de Cierre de Día
              </h3>
              <p className="text-gray-600">
                Fecha: {formatearFecha(reportDate)}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Vista previa del reporte:</strong> Este reporte contiene todos los detalles de ventas, productos vendidos, métodos de pago y gastos del día.
                </p>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                    <ReporteCierreDia reportData={dailyData} reportDate={reportDate} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-lg transition-colors duration-200"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Reporte Cierre de Día - ${reportDate}</title>
                          <style>
                            body { margin: 0; padding: 0; }
                            @media print {
                              body { margin: 0; }
                              @page { margin: 0; size: 80mm auto; }
                            }
                          </style>
                        </head>
                        <body>
                          <div id="print-content"></div>
                        </body>
                      </html>
                    `);

                    // Buscar el componente ReporteCierreDia en el DOM
                    const reportElement = document.querySelector('[style*="width: 80mm"]');
                    if (reportElement) {
                      const clonedElement = reportElement.cloneNode(true);
                      printWindow.document.getElementById('print-content').appendChild(clonedElement);
                    }

                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg transition-colors duration-200"
                >
                  🖨️ Imprimir
                </button>
                {esHoy && !dailyData.esResumenDiario && (
                  <button
                    onClick={confirmarCierreDespuesDeImprimir}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-5 rounded-lg transition-colors duration-200"
                  >
                    🔒 Imprimir y Cerrar Día
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReporteDiaSection;