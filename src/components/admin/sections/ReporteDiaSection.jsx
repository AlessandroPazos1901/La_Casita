// ReporteDiaSection.jsx
import React, { useState, useEffect } from 'react';
// import useDashboard from '../../../hooks/useDashboard';
import { useDataCache } from '../../../contexts/DataCacheContext';
import { supabase } from '../../../services/supabaseClient';

function ReporteDiaSection() {
  const { getFreshDailyData, 
    refreshCache ,
    isLoading: initialLoading 
  } = useDataCache();
  const today = new Date().toISOString().split('T')[0];
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyData, setDailyData] = useState({
    ingresos: [],
    gastos: [],
    totalIngresos: 0,
    totalGastos: 0,
    balanceNeto: 0,
    ingresosPorOrigen: { efectivo: 0, pos: 0, yape_plin: 0 }
  });
  // Funcion para el cierre del dia
  const handleCerrarDia = async () => {
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

  // Cargar datos cuando cambie la fecha o los datos del dashboard
  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtenemos los datos frescos para la fecha seleccionada
        const { ventas, gastos } = await getFreshDailyData(reportDate);

        // Calculamos los totales con los datos frescos
        const totalIngresos = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
        const totalGastos = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
        const balanceNeto = totalIngresos - totalGastos;

        const ingresosPorOrigen = { efectivo: 0, pos: 0, yape_plin: 0 };
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

        setDailyData({
          ingresos: ventas,
          gastos: gastos,
          totalIngresos,
          totalGastos,
          balanceNeto,
          ingresosPorOrigen
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
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-orange-500 pb-2">
        <i className="fas fa-calendar-day text-orange-500 mr-3"></i>
        Reporte del Día
      </h1>
      {/* Boton de Cerrar dia */}
      <button
          onClick={handleCerrarDia}
          disabled={isClosing}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-wait"
        >
          {isClosing ? 'Cerrando...' : '🔒 Cerrar Día'}
      </button>
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
                setReportDate(yesterday.toISOString().split('T')[0]);
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
            {esHoy && <span className="ml-2 text-sm text-green-600 font-normal">(Hoy)</span>}
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
            <table className="min-w-full bg-white rounded-lg shadow-md">
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
    </div>
  );
}

export default ReporteDiaSection;