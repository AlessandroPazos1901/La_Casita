import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../services/supabaseClient';
import PlatosChart from '../charts/PlatosChart';

const LoadingComponent = ({ message }) => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    <div className="ml-4 text-lg text-gray-600">{message}</div>
  </div>
);

function DashboardSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [chartView, setChartView] = useState('mas-vendidos');
  
  const [stats, setStats] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    gananciaNeta: 0,
    totalPedidos: 0,
    promedioTicket: 0,
    ingresosPorOrigen: { efectivo: 0, pos: 0, yape_plin: 0 },
    gastosPorCategoria: {},
    platosVendidos: [],
    presupuestos: [], // Para la sección de presupuestos
    gastosDelMesPorCategoria: {} // Para la sección de presupuestos
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const getStartDate = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
    return startDate.toISOString().split('T')[0];
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    const startDate = getStartDate();

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // 1. AÑADIMOS UNA NUEVA CONSULTA para los reportes diarios
      const [analisisResult, gastosResult, productosResult, origenResult, presupuestosResult, reportesResult] = await Promise.all([
        supabase.from('analisis_diario').select('*').gte('fecha', startDate),
        supabase.from('gastos_por_categoria').select('*').gte('fecha', startDate),
        supabase.from('productos_mas_vendidos').select('*').gte('fecha', startDate),
        supabase.from('pedidos').select('total, metodo_pago').eq('estado', 'pagado').gte('created_at', startDate),
        supabase.from('presupuestos').select('*').eq('mes', currentMonth).eq('año', currentYear),
        supabase.from('reportes_diarios').select('ingresos_efectivo, ingresos_pos, ingresos_yape_plin').gte('fecha', startDate) // <-- NUEVA CONSULTA
      ]);

      if (analisisResult.error) throw analisisResult.error;
      if (gastosResult.error) throw gastosResult.error;
      if (productosResult.error) throw productosResult.error;
      if (origenResult.error) throw origenResult.error;

      // Procesamiento de datos
      const analisisData = analisisResult.data || [];
      const totalIngresos = analisisData.reduce((sum, day) => sum + parseFloat(day.ingresos || 0), 0);
      const totalGastos = analisisData.reduce((sum, day) => sum + parseFloat(day.gastos || 0), 0);
      const totalPedidos = (await supabase.from('ventas_diarias').select('numero_pedidos').gte('fecha', startDate)).data.reduce((sum, day) => sum + day.numero_pedidos, 0);

      const ingresosPorOrigen = { efectivo: 0, pos: 0, yape_plin: 0 };
      (origenResult.data || []).forEach(venta => {
        const metodo = venta.metodo_pago || 'efectivo';
        if (ingresosPorOrigen.hasOwnProperty(metodo)) {
          ingresosPorOrigen[metodo] += parseFloat(venta.total || 0);
        }
      });

      // Sumamos los datos de los días "archivados"
      (reportesResult.data || []).forEach(reporte => {
        ingresosPorOrigen.efectivo += parseFloat(reporte.ingresos_efectivo || 0);
        ingresosPorOrigen.pos += parseFloat(reporte.ingresos_pos || 0);
        ingresosPorOrigen.yape_plin += parseFloat(reporte.ingresos_yape_plin || 0);
      });
      
      const gastosPorCategoria = (gastosResult.data || []).reduce((acc, g) => ({ ...acc, [g.categoria]: (acc[g.categoria] || 0) + parseFloat(g.total_gastado) }), {});
      const platosVendidosAgrupados = (productosResult.data || []).reduce((acc, p) => {
        if (!acc[p.producto_nombre]) {
            acc[p.producto_nombre] = { nombre: p.producto_nombre, cantidad: 0, ingresos: 0 };
        }
        acc[p.producto_nombre].cantidad += p.cantidad_vendida;
        acc[p.producto_nombre].ingresos += p.ingresos_generados;
        return acc;
      }, {});
      
      const platosArray = Object.values(platosVendidosAgrupados);
      
      const gastosDelMes = (gastosResult.data || []).filter(g => new Date(g.fecha).getMonth() + 1 === currentMonth && new Date(g.fecha).getFullYear() === currentYear);
      const gastosDelMesPorCategoria = gastosDelMes.reduce((acc, g) => ({ ...acc, [g.categoria]: (acc[g.categoria] || 0) + parseFloat(g.total_gastado) }), {});

      setStats({
        totalIngresos, totalGastos, gananciaNeta: totalIngresos - totalGastos,
        totalPedidos, promedioTicket: totalPedidos > 0 ? totalIngresos / totalPedidos : 0,
        ingresosPorOrigen, gastosPorCategoria, platosVendidos: platosArray,
        presupuestos: presupuestosResult.data || [],
        platosVendidos: platosArray,
        gastosDelMesPorCategoria
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const platosParaGrafico = useMemo(() => {
    const sorted = [...stats.platosVendidos];
    if (chartView === 'mas-vendidos') {
      return sorted.sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
    }
    return sorted.sort((a, b) => a.cantidad - b.cantidad).slice(0, 10);
  }, [stats.platosVendidos, chartView]);

  const expenseCategories = useMemo(() => {
      const allCategories = new Set([
          ...Object.keys(stats.gastosPorCategoria),
          ...stats.presupuestos.map(p => p.categoria)
      ]);
      return Array.from(allCategories);
  }, [stats.gastosPorCategoria, stats.presupuestos]);

  const presupuestosPorCategoria = useMemo(() => {
      return stats.presupuestos.reduce((acc, p) => ({...acc, [p.categoria]: parseFloat(p.monto_presupuestado)}), {});
  }, [stats.presupuestos]);


  if (loading) return <LoadingComponent message="Cargando estadísticas..." />;
  if (error) return <div className="bg-red-100 p-4 rounded-lg text-red-700">Error: {error}</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-orange-500 pb-2">
        <i className="fas fa-chart-line text-orange-500 mr-3"></i>Dashboard Financiero
      </h1>

      {/* Selector de período y vista */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Período de análisis:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 w-full"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Vista de platos:</label>
            <select
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
              className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 w-full"
            >
              <option value="mas-vendidos">Más Vendidos</option>
              <option value="menos-vendidos">Menos Vendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-green-100 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-green-700 mb-2">Ingresos Totales</h2>
          <p className="text-3xl font-bold text-green-900">S/.{stats.totalIngresos.toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-1">({stats.totalPedidos} pedidos)</p>
        </div>
        <div className="bg-red-100 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Gastos Totales</h2>
          <p className="text-3xl font-bold text-red-900">S/.{stats.totalGastos.toFixed(2)}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-md border-l-4 ${stats.gananciaNeta >= 0 ? 'bg-blue-100 border-blue-500' : 'bg-red-100 border-red-500'}`}>
          <h2 className={`text-xl font-semibold mb-2 ${stats.gananciaNeta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Ganancia Neta</h2>
          <p className={`text-3xl font-bold ${stats.gananciaNeta >= 0 ? 'text-blue-900' : 'text-red-900'}`}>S/.{stats.gananciaNeta.toFixed(2)}</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h2 className="text-xl font-semibold text-purple-700 mb-2">Ticket Promedio</h2>
          <p className="text-3xl font-bold text-purple-900">S/.{stats.promedioTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Ingresos por origen */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-2">Ingresos por Origen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700">Efectivo</h3>
            <p className="text-2xl font-semibold text-blue-900">S/.{stats.ingresosPorOrigen.efectivo.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700">POS</h3>
            <p className="text-2xl font-semibold text-blue-900">S/.{stats.ingresosPorOrigen.pos.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-700">Yape/Plin</h3>
            <p className="text-2xl font-semibold text-green-900">S/.{stats.ingresosPorOrigen.yape_plin.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Platos Más/Menos Vendidos */}
      <PlatosChart 
        platosData={platosParaGrafico}
        periodo={selectedPeriod}
        chartType={chartView}
        title={`Top 10 Platos ${chartView === 'mas-vendidos' ? 'Más' : 'Menos'} Vendidos`}
      />

      {/* Gastos por Categoría */}
      <div className="my-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-2">Gastos por Categoría</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(stats.gastosPorCategoria).length > 0 ? Object.entries(stats.gastosPorCategoria).map(([category, total]) => (
            <div key={category} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700">{category}</h3>
              <p className="text-2xl font-semibold text-gray-900">S/.{total.toFixed(2)}</p>
            </div>
          )) : <p className="text-gray-500">No hay gastos en este período.</p>}
        </div>
      </div>

      {/* Presupuesto vs. Gasto Real (Mes Actual) */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-2">Presupuesto vs. Gasto Real (Mes Actual)</h2>
        {stats.presupuestos.length === 0 ? (
          <div className="bg-yellow-100 p-3 rounded">No hay presupuestos para este mes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                  <th className="py-3 px-6 text-left">Categoría</th>
                  <th className="py-3 px-6 text-left">Presupuesto</th>
                  <th className="py-3 px-6 text-left">Gasto Real</th>
                  <th className="py-3 px-6 text-left">Diferencia</th>
                  <th className="py-3 px-6 text-left">% Usado</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {expenseCategories.map(category => {
                  const presupuesto = presupuestosPorCategoria[category] || 0;
                  const gastoReal = stats.gastosDelMesPorCategoria[category] || 0;
                  const diferencia = presupuesto - gastoReal;
                  const porcentajeUsado = presupuesto > 0 ? (gastoReal / presupuesto) * 100 : 0;
                  
                  return (
                    <tr key={category} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{category}</td>
                      <td className="py-3 px-6 text-left">S/.{presupuesto.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">S/.{gastoReal.toFixed(2)}</td>
                      <td className={`py-3 px-6 text-left font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        S/.{diferencia.toFixed(2)}
                      </td>
                      <td className={`py-3 px-6 text-left font-semibold ${porcentajeUsado > 100 ? 'text-red-600' : porcentajeUsado > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {porcentajeUsado.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardSection;