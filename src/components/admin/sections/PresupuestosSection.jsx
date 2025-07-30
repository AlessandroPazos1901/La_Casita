import React, {useState, useEffect } from 'react';
import useDashboard from '../../../hooks/useDashboard';
import FormularioPresupuesto from '../forms/FormularioPresupuesto';
import CategoriaManagement from './CategoriaManagement';
import { supabase } from '../../../services/supabaseClient';

function PresupuestosSection() {
  const { categorias, loading, error } = useDashboard();
  
  const [presupuestos, setPresupuestos] = useState([]);
  const [presupuestosLoading, setPresupuestosLoading] = useState(true);
  const [presupuestosError, setPresupuestosError] = useState(null);
  
  // Este estado ahora se cargará desde la base de datos
  const [gastosPorCategoria, setGastosPorCategoria] = useState({}); 

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingPresupuesto, setEditingPresupuesto] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('presupuestos');
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    // La condición `categorias.length > 0` asegura que no se ejecute
    // hasta que tengamos la lista de categorías disponible.
    if (categorias && categorias.length > 0) {
      loadPresupuestos();
    }
  }, [selectedMonth, selectedYear, categorias]);

  // Esta función ahora carga tanto presupuestos como los gastos reales del mes
  const loadPresupuestos = async () => {
    setPresupuestosLoading(true);
    setPresupuestosError(null);

    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const [presupuestosResult, gastosResult] = await Promise.all([
        supabase
          .from('presupuestos')
          .select('*')
          .eq('mes', selectedMonth)
          .eq('año', selectedYear),
        supabase
          .from('gastos_por_categoria') // Usamos la VISTA
          .select('categoria, total_gastado')
          .gte('fecha', startDate)
          .lte('fecha', endDate)
      ]);

      if (presupuestosResult.error) throw presupuestosResult.error;
      if (gastosResult.error) throw gastosResult.error;

      setPresupuestos(presupuestosResult.data || []);

      const gastosAgrupados = (gastosResult.data || []).reduce((acc, gasto) => {
        acc[gasto.categoria] = (acc[gasto.categoria] || 0) + parseFloat(gasto.total_gastado);
        return acc;
      }, {});
      
      setGastosPorCategoria(gastosAgrupados);

    } catch (err) {
      console.error('Error loading data for period:', err);
      setPresupuestosError(err.message);
    } finally {
      setPresupuestosLoading(false);
    }
  };

  const handleAddOrUpdateBudget = async (categoria, montoPresupuestado) => {
    if (!categoria || !montoPresupuestado || parseFloat(montoPresupuestado) <= 0) {
      alert('Por favor, complete todos los campos y asegúrese de que el monto sea positivo.');
      return;
    }

    try {
      // Verificar si ya existe un presupuesto para esta categoría en este mes/año
      const { data: existingBudget, error: checkError } = await supabase
        .from('presupuestos')
        .select('id')
        .eq('mes', selectedMonth)
        .eq('año', selectedYear)
        .eq('categoria', categoria)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBudget) {
        // Actualizar presupuesto existente
        const { error } = await supabase
          .from('presupuestos')
          .update({ 
            monto_presupuestado: parseFloat(montoPresupuestado),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBudget.id);

        if (error) throw error;
        console.log('Presupuesto actualizado correctamente');
      } else {
        // Crear nuevo presupuesto
        const { error } = await supabase
          .from('presupuestos')
          .insert([{
            mes: selectedMonth,
            año: selectedYear,
            categoria,
            monto_presupuestado: parseFloat(montoPresupuestado),
            monto_gastado: 0
          }]);

        if (error) throw error;
        console.log('Presupuesto creado correctamente');
      }

      // Recargar presupuestos
      await loadPresupuestos();
    } catch (err) {
      console.error('Error saving presupuesto:', err);
      alert('Error al guardar el presupuesto: ' + err.message);
    }
  };

  const handleEditPresupuesto = (presupuesto) => {
    setEditingPresupuesto(presupuesto);
    setShowEditModal(true);
  };

  const handleUpdatePresupuesto = async (montoPresupuestado) => {
    if (!editingPresupuesto || !montoPresupuestado || parseFloat(montoPresupuestado) <= 0) {
      alert('Por favor, ingrese un monto válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('presupuestos')
        .update({ 
          monto_presupuestado: parseFloat(montoPresupuestado),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPresupuesto.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingPresupuesto(null);
      await loadPresupuestos();
      console.log('Presupuesto actualizado correctamente');
    } catch (err) {
      console.error('Error updating presupuesto:', err);
      alert('Error al actualizar el presupuesto: ' + err.message);
    }
  };

  const handleDeletePresupuesto = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('presupuestos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPresupuestos();
      console.log('Presupuesto eliminado correctamente');
    } catch (err) {
      console.error('Error deleting presupuesto:', err);
      alert('Error al eliminar el presupuesto: ' + err.message);
    }
  };

  // Obtener color de categoría
  const getCategoriaColor = (categoriaNombre) => {
    const categoria = categorias.find(cat => cat.nombre === categoriaNombre);
    return categoria ? categoria.color : '#6B7280';
  };

  // Modal para editar presupuesto
  const EditPresupuestoModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Editar Presupuesto - {editingPresupuesto?.categoria}
        </h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleUpdatePresupuesto(formData.get('monto'));
        }}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Monto Presupuestado (S/.)
            </label>
            <input
              type="number"
              name="monto"
              defaultValue={editingPresupuesto?.monto_presupuestado}
              step="0.01"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-64">
    <div className="text-lg">Cargando datos...</div>
  </div>;
  
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    Error: {error}
  </div>;

  const expenseCategories = categorias ? categorias.map(cat => cat.nombre) : [];

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-orange-500 pb-2">
        <i className="fas fa-wallet text-orange-500 mr-3"></i>Gestión de Presupuestos
      </h1>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('presupuestos')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'presupuestos'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Presupuestos
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'categorias'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-tags mr-2"></i>
            Categorías
          </button>
        </div>
      </div>

      {activeTab === 'categorias' ? (
        <CategoriaManagement />
      ) : (
        <>
          {/* Selector de Mes y Año */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Seleccionar Período</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Mes</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Año</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <FormularioPresupuesto
            expenseCategories={expenseCategories}
            onSaveBudget={handleAddOrUpdateBudget}
          />

          {/* Modal para editar */}
          {showEditModal && <EditPresupuestoModal />}

          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Presupuestos - {months[selectedMonth - 1]} {selectedYear}
            </h2>
            
            {presupuestosLoading ? (
              <div className="text-center py-4">Cargando presupuestos...</div>
            ) : presupuestosError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                Error al cargar presupuestos: {presupuestosError}
              </div>
            ) : presupuestos.length === 0 ? (
              <p className="text-gray-500">No hay presupuestos establecidos para este período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left rounded-tl-lg">Categoría</th>
                      <th className="py-3 px-6 text-left">Presupuestado</th>
                      <th className="py-3 px-6 text-left">Gastado</th>
                      <th className="py-3 px-6 text-left">Restante</th>
                      <th className="py-3 px-6 text-left">% Usado</th>
                      <th className="py-3 px-6 text-center rounded-tr-lg">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {presupuestos.map((presupuesto) => {
                      const gastado = gastosPorCategoria[presupuesto.categoria] || 0;
                      const restante = presupuesto.monto_presupuestado - gastado;
                      const porcentajeUsado = presupuesto.monto_presupuestado > 0 
                        ? (gastado / presupuesto.monto_presupuestado) * 100 
                        : 0;
                      
                      return (
                        <tr key={presupuesto.id} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="py-3 px-6 text-left">
                            <span 
                              className="px-2 py-1 text-white rounded-full text-xs font-medium"
                              style={{ backgroundColor: getCategoriaColor(presupuesto.categoria) }}
                            >
                              {presupuesto.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-left font-semibold">
                            S/.{parseFloat(presupuesto.monto_presupuestado).toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-left font-semibold text-red-600">
                            S/.{gastado.toFixed(2)}
                          </td>
                          <td className={`py-3 px-6 text-left font-semibold ${restante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            S/.{restante.toFixed(2)}
                          </td>
                          <td className="py-3 px-6 text-left">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    porcentajeUsado > 100 ? 'bg-red-500' : 
                                    porcentajeUsado > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${
                                porcentajeUsado > 100 ? 'text-red-600' : 
                                porcentajeUsado > 80 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {porcentajeUsado.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditPresupuesto(presupuesto)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeletePresupuesto(presupuesto.id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PresupuestosSection;