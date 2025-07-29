import React, { useState, useEffect } from 'react';
import useDashboard from '../../../hooks/useDashboard';
import PlatosChart from '../charts/PlatosChart';
import { supabase } from '../../../services/supabaseClient';

function DashboardSection() {
  const { gastos, categorias, ventas, loading, error, estadisticas } = useDashboard();
  const [presupuestos, setPresupuestos] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // días
  const [historicalData, setHistoricalData] = useState([]);
  const [chartView, setChartView] = useState('mas-vendidos'); // 'mas-vendidos' o 'menos-vendidos'
  
  const expenseCategories = categorias ? categorias.map(cat => cat.nombre) : [];

  // Cargar presupuestos del mes actual
  useEffect(() => {
    loadCurrentMonthBudgets();
    generateHistoricalData();
  }, [selectedPeriod, ventas, gastos]);

  const loadCurrentMonthBudgets = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('mes', currentMonth)
        .eq('año', currentYear);

      if (error) throw error;
      setPresupuestos(data || []);
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  };

  const generateHistoricalData = () => {
    const days = parseInt(selectedPeriod);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0];
      
      // Calcular ingresos reales del día
      const ventasDelDia = ventas.filter(venta => {
        const fechaVenta = new Date(venta.created_at).toDateString();
        const fechaComparacion = date.toDateString();
        return fechaVenta === fechaComparacion && venta.estado === 'pagado';
      });
      
      const ingresosDelDia = ventasDelDia.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
      
      // Calcular gastos reales del día
      const gastosDelDia = gastos.filter(gasto => {
        const fechaGasto = new Date(gasto.fecha).toDateString();
        const fechaComparacion = date.toDateString();
        return fechaGasto === fechaComparacion;
      });
      
      const gastosDelDiaTotal = gastosDelDia.reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
      
      // Calcular ganancia neta del día
      const gananciaNeta = ingresosDelDia - gastosDelDiaTotal;
      
      data.push({
        date: formattedDate,
        ingresos: ingresosDelDia,
        gastos: gastosDelDiaTotal,
        ganancia: gananciaNeta,
        pedidos: ventasDelDia.length
      });
    }
    
    setHistoricalData(data);
  };

  if (loading) return <div className="flex justify-center items-center h-64">
    <div className="text-lg">Cargando dashboard...</div>
  </div>;
  
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    Error: {error}
  </div>;

  // Cálculos para el período seleccionado
  const totalIngresos = historicalData.reduce((sum, day) => sum + day.ingresos, 0);
  const totalGastos = historicalData.reduce((sum, day) => sum + day.gastos, 0);
  const gananciaNeta = totalIngresos - totalGastos;
  const totalPedidos = historicalData.reduce((sum, day) => sum + day.pedidos, 0);
  const promedioTicket = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

  // Gastos por categoría (período actual)
  const gastosDelPeriodo = gastos.filter(gasto => {
    const fechaGasto = new Date(gasto.fecha);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(selectedPeriod));
    return fechaGasto >= fechaLimite;
  });

  const gastosPorCategoria = expenseCategories.reduce((acc, category) => {
    acc[category] = gastosDelPeriodo
      .filter(gasto => gasto.categoria === category)
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
    return acc;
  }, {});

  // Presupuestos por categoría (mes actual)
  const presupuestosPorCategoria = presupuestos.reduce((acc, presupuesto) => {
    acc[presupuesto.categoria] = parseFloat(presupuesto.monto_presupuestado || 0);
    return acc;
  }, {});

  // Gastos del mes actual para comparar con presupuestos
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const gastosDelMesActual = gastos.filter(gasto => {
    const fechaGasto = new Date(gasto.fecha);
    return fechaGasto.getMonth() === currentMonth && fechaGasto.getFullYear() === currentYear;
  });

  const gastosDelMesPorCategoria = expenseCategories.reduce((acc, category) => {
    acc[category] = gastosDelMesActual
      .filter(gasto => gasto.categoria === category)
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto || 0), 0);
    return acc;
  }, {});

  // Ingresos por origen
  const ventasDelPeriodo = ventas.filter(venta => {
    const fechaVenta = new Date(venta.created_at);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(selectedPeriod));
    return fechaVenta >= fechaLimite && venta.estado === 'pagado';
  });

  const ingresosPorOrigen = {
    efectivo: 0,
    pos: 0,
    yape_plin: 0
  };

  ventasDelPeriodo.forEach(venta => {
    const origen = venta.metodo_pago || 'mesa';
    if (origen === 'efectivo') {
      ingresosPorOrigen.efectivo += parseFloat(venta.total || 0);
    } else if (origen === 'pos') {
      ingresosPorOrigen.pos += parseFloat(venta.total || 0);
    } else if (origen === 'yape_plin') {
      ingresosPorOrigen.yape_plin += parseFloat(venta.total || 0);
    }
  });

  // Calcular platos más/menos vendidos para el período seleccionado
  const calcularPlatosVendidos = () => {
    const platosPorNombre = {};
    
    ventasDelPeriodo.forEach(venta => {
      if (venta.pedido_items && venta.pedido_items.length > 0) {
        venta.pedido_items.forEach(item => {
          const nombrePlato = item.producto?.nombre || 'Producto desconocido';
          const cantidad = parseInt(item.cantidad || 0);
          const precio = parseFloat(item.precio_unitario || 0);
          
          if (!platosPorNombre[nombrePlato]) {
            platosPorNombre[nombrePlato] = {
              nombre: nombrePlato,
              cantidad: 0,
              ingresos: 0
            };
          }
          
          platosPorNombre[nombrePlato].cantidad += cantidad;
          platosPorNombre[nombrePlato].ingresos += cantidad * precio;
        });
      }
    });

    // Convertir a array y ordenar
    const platosArray = Object.values(platosPorNombre);
    
    if (chartView === 'mas-vendidos') {
      return platosArray.sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
    } else {
      // Menos vendidos - filtrar los que tienen al menos 1 venta y ordenar ascendente
      return platosArray
        .filter(plato => plato.cantidad > 0)
        .sort((a, b) => a.cantidad - b.cantidad)
        .slice(0, 10);
    }
  };

  const platosVendidos = calcularPlatosVendidos();

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
              className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
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
              className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
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
          <p className="text-3xl font-bold text-green-900">S/.{totalIngresos.toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-1">({totalPedidos} pedidos)</p>
        </div>
        
        <div className="bg-red-100 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Gastos Totales</h2>
          <p className="text-3xl font-bold text-red-900">S/.{totalGastos.toFixed(2)}</p>
        </div>
        
        <div className={`p-6 rounded-lg shadow-md border-l-4 ${gananciaNeta >= 0 ? 'bg-blue-100 border-blue-500' : 'bg-red-100 border-red-500'}`}>
          <h2 className={`text-xl font-semibold mb-2 ${gananciaNeta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            Ganancia Neta
          </h2>
          <p className={`text-3xl font-bold ${gananciaNeta >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            S/.{gananciaNeta.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-purple-100 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h2 className="text-xl font-semibold text-purple-700 mb-2">Ticket Promedio</h2>
          <p className="text-3xl font-bold text-purple-900">S/.{promedioTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Ingresos por origen */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
          <i className="fas fa-chart-pie text-gray-600 mr-2"></i>Ingresos por Origen (Últimos {selectedPeriod} días)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
            <h3 className="text-lg font-medium text-blue-700">Efectivo</h3>
            <p className="text-2xl font-semibold text-blue-900">S/.{ingresosPorOrigen.efectivo.toFixed(2)}</p>
            <p className="text-sm text-blue-600">
              {totalIngresos > 0 ? ((ingresosPorOrigen.efectivo / totalIngresos) * 100).toFixed(1) : 0}% del total
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
            <h3 className="text-lg font-medium text-blue-700">POS</h3>
            <p className="text-2xl font-semibold text-blue-900">S/.{ingresosPorOrigen.pos.toFixed(2)}</p>
            <p className="text-sm text-blue-600">
              {totalIngresos > 0 ? ((ingresosPorOrigen.pos / totalIngresos) * 100).toFixed(1) : 0}% del total
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
            <h3 className="text-lg font-medium text-green-700">Yape/Plin</h3>
            <p className="text-2xl font-semibold text-green-900">S/.{ingresosPorOrigen.yape_plin.toFixed(2)}</p>
            <p className="text-sm text-green-600">
              {totalIngresos > 0 ? ((ingresosPorOrigen.yape_plin / totalIngresos) * 100).toFixed(1) : 0}% del total
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Platos Más/Menos Vendidos */}
      <PlatosChart 
        platosData={platosVendidos}
        periodo={selectedPeriod}
        chartType={chartView}
        title={`Top 10 Platos ${chartView === 'mas-vendidos' ? 'Más' : 'Menos'} Vendidos (Últimos ${selectedPeriod} días)`}
      />

      {/* Gastos por Categoría */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
          <i className="fas fa-tags text-gray-600 mr-2"></i>Gastos por Categoría (Últimos {selectedPeriod} días)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {expenseCategories.map(category => (
            <div key={category} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700">{category}</h3>
              <p className="text-2xl font-semibold text-gray-900">S/.{gastosPorCategoria[category].toFixed(2)}</p>
              <p className="text-sm text-gray-600">
                {totalGastos > 0 ? ((gastosPorCategoria[category] / totalGastos) * 100).toFixed(1) : 0}% del total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Presupuesto vs. Gasto Real (Mes Actual) */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
          <i className="fas fa-balance-scale text-gray-600 mr-2"></i>Presupuesto vs. Gasto Real (Mes Actual)
        </h2>
        {presupuestos.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            No hay presupuestos establecidos para este mes. 
            <a href="#presupuestos" className="underline ml-1">Crear presupuestos</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left rounded-tl-lg">Categoría</th>
                  <th className="py-3 px-6 text-left">Presupuesto</th>
                  <th className="py-3 px-6 text-left">Gasto Real</th>
                  <th className="py-3 px-6 text-left">Diferencia</th>
                  <th className="py-3 px-6 text-left rounded-tr-lg">% Usado</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {expenseCategories.map(category => {
                  const presupuesto = presupuestosPorCategoria[category] || 0;
                  const gastoReal = gastosDelMesPorCategoria[category] || 0;
                  const diferencia = presupuesto - gastoReal;
                  const porcentajeUsado = presupuesto > 0 ? (gastoReal / presupuesto) * 100 : 0;
                  
                  const diferenciaClass = diferencia >= 0 ? 'text-green-600' : 'text-red-600';
                  const porcentajeClass = porcentajeUsado > 100 ? 'text-red-600' : 
                                         porcentajeUsado > 80 ? 'text-yellow-600' : 'text-green-600';

                  return (
                    <tr key={category} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {category}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-left font-semibold">S/.{presupuesto.toFixed(2)}</td>
                      <td className="py-3 px-6 text-left font-semibold text-red-600">S/.{gastoReal.toFixed(2)}</td>
                      <td className={`py-3 px-6 text-left font-semibold ${diferenciaClass}`}>
                        S/.{diferencia.toFixed(2)}
                      </td>
                      <td className={`py-3 px-6 text-left font-semibold ${porcentajeClass}`}>
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