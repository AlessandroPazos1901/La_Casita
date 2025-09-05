import React, { useState } from 'react';
import useDashboard from '../../../hooks/useDashboard';
import FormularioGasto from '../forms/FormularioGasto';
import useMessages from '../../../hooks/useMessages';

function AddPendingPaymentModal({
  expenseCategories,
  newPendingCategory,
  setNewPendingCategory,
  newPendingAmount,
  setNewPendingAmount,
  newPendingDescription,
  setNewPendingDescription,
  newPendingDueDate,
  setNewPendingDueDate,
  handleAddPendingPayment,
  closeModal
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Añadir Nueva Cuenta Pendiente</h2>
        <form onSubmit={handleAddPendingPayment}>
          <div className="mb-4">
            <label htmlFor="modalNewPendingCategory" className="block text-gray-700 text-sm font-bold mb-2">
              Categoría
            </label>
            <select
              id="modalNewPendingCategory"
              value={newPendingCategory}
              onChange={(e) => setNewPendingCategory(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            >
              <option value="">Seleccione una categoría</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="modalNewPendingAmount" className="block text-gray-700 text-sm font-bold mb-2">
              Monto (S/.)
            </label>
            <input
              type="number"
              id="modalNewPendingAmount"
              value={newPendingAmount}
              onChange={(e) => setNewPendingAmount(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Ej: 150.00"
              step="0.01"
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label htmlFor="modalNewPendingDescription" className="block text-gray-700 text-sm font-bold mb-2">
              Descripción
            </label>
            <input
              type="text"
              id="modalNewPendingDescription"
              value={newPendingDescription}
              onChange={(e) => setNewPendingDescription(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Ej: Pago a proveedor de carnes"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="modalNewPendingDueDate" className="block text-gray-700 text-sm font-bold mb-2">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              id="modalNewPendingDueDate"
              value={newPendingDueDate}
              onChange={(e) => setNewPendingDueDate(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Añadir Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function GastosSection() {
  const { 
    gastos, 
    categorias,
    loading,
    error,
    addGasto,
    updateGasto,
    deleteGasto,
    refreshData,
    addCuentaPendiente,
    deleteCuentaPendiente,
    cuentasPendientes
    } = useDashboard();
  const [showAddPendingModal, setShowAddPendingModal] = useState(false);
  const [newPendingDescription, setNewPendingDescription] = useState('');
  const [newPendingDueDate, setNewPendingDueDate] = useState('');
  const [newPendingAmount, setNewPendingAmount] = useState('');
  const [newPendingCategory, setNewPendingCategory] = useState('');
  const [editingGasto, setEditingGasto] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showSuccess, showError } = useMessages();
  const expenseCategories = (categorias || []).map(cat => cat.nombre);

  // DESPUÉS de todos los hooks, los returns condicionales
// Agregar esta validación después de los hooks y antes de los returns:
  if (loading) return <div className="flex justify-center items-center h-64">
    <div className="text-lg">Cargando gastos...</div>
  </div>;

  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    Error: {error}
  </div>;

  // Agregar esta validación para categorías:
  // if (!categorias || categorias.length === 0) {
  //   return <div className="flex justify-center items-center h-64">
  //     <div className="text-lg">Cargando categorías...</div>
  //   </div>;
  // }

  const handleAddExpense = async (categoria, descripcion, monto, fecha) => {
    if (!categoria || !descripcion || !monto || parseFloat(monto) <= 0 || !fecha) {
      alert('Por favor, complete todos los campos obligatorios y asegúrese de que el monto sea positivo.');
      return;
    }

    const gastoData = {
      categoria,
      descripcion,
      monto: parseFloat(monto),
      fecha
    };

    const result = await addGasto(gastoData);
    if (result.success) {
      console.log("Gasto añadido correctamente");
      // El hook ya actualiza el estado automáticamente
    } else {
      console.error("Error añadiendo gasto:", result.error);
      alert("Error al añadir el gasto: " + result.error);
    }
  };

  const handleEditGasto = (gasto) => {
    setEditingGasto(gasto);
    setShowEditModal(true);
  };

  const handleUpdateGasto = async (gastoData) => {
    if (!editingGasto) return;

    const result = await updateGasto(editingGasto.id, gastoData);
    if (result.success) {
      console.log("Gasto actualizado correctamente");
      setShowEditModal(false);
      setEditingGasto(null);
    } else {
      console.error("Error actualizando gasto:", result.error);
      alert("Error al actualizar el gasto: " + result.error);
    }
  };

  const handleDeleteGasto = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      const result = await deleteGasto(id);
      if (result.success) {
        console.log("Gasto eliminado correctamente");
      } else {
        console.error("Error eliminando gasto:", result.error);
        alert("Error al eliminar el gasto: " + result.error);
      }
    }
  };
  
  const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
  };
  
  // FUNCIÓN AUXILIAR PARA CREAR EL ENLACE DE  GOOGLE CALENDAR
  const createGoogleCalendarLink = (cuenta) => {
    const baseURL = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    
    // Título del evento
    const title = encodeURIComponent(`Pagar: ${cuenta.descripcion}`);
    
    // Formateamos la fecha para que Google la entienda (YYYYMMDD)
    const fecha = new Date(cuenta.fecha_vencimiento + 'T00:00:00'); // Asegura la fecha local
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}${month}${day}`;
    const dates = `${fechaFormateada}/${fechaFormateada}`; // Evento de todo el día
    console.log('Fecha formateada para Google Calendar:', fechaFormateada);
    console.log('Fecha Sin formatear:', fecha);
    // Descripción del evento
    const details = encodeURIComponent(
      `Monto a pagar: S/. ${cuenta.monto.toFixed(2)}\nCategoría: ${cuenta.categoria}`
    );

    return `${baseURL}&text=${title}&dates=${dates}&details=${details}`;
  };

  const handleAddPendingPayment = async (e) => {
    e.preventDefault();
    if (!newPendingCategory || !newPendingDescription || !newPendingAmount || parseFloat(newPendingAmount) <= 0 || !newPendingDueDate) {
      alert('Por favor, complete todos los campos obligatorios para el pago pendiente.');
      return;
    }

    const newPending = {
      categoria: newPendingCategory,
      descripcion: newPendingDescription,
      monto: parseFloat(newPendingAmount),
      fecha_vencimiento: newPendingDueDate,
    };

    const result = await addCuentaPendiente(newPending);
    if (result.success) {
      // Creamos el enlace y lo abrimos en una nueva pestaña
      const calendarLink = createGoogleCalendarLink(newPending);
      window.open(calendarLink, '_blank');

      showSuccess('Cuenta pendiente creada. Revisa la nueva pestaña para guardarla en Google Calendar.');
      
      
      setNewPendingCategory('');
      setNewPendingDescription('');
      setNewPendingAmount('');
      setNewPendingDueDate('');
      setShowAddPendingModal(false);
      console.log("Cuenta pendiente añadida correctamente");
      // Refrescar datos para mostrar la nueva cuenta
      refreshData();
    } else {
      alert("Error al añadir cuenta pendiente: " + result.error);
    }
  };
  const handleDeletePendingPayment = async (payment) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta cuenta pendiente?')) {
      const result = await deleteCuentaPendiente(payment.id);
      if (result.success) {
        console.log("Cuenta pendiente eliminada correctamente");
        // Refrescar datos para que se actualice la vista
        refreshData();
      } else {
        alert("Error al eliminar cuenta pendiente: " + result.error);
      }
    }
  };
  const handleMarkAsPaid = async (payment) => {
    const gastoData = {
      categoria: payment.categoria || payment.category || 'Otros',
      descripcion: payment.descripcion || payment.description || 'Pago pendiente marcado como pagado',
      monto: parseFloat(payment.monto || payment.amount || 0),
      fecha: new Date().toISOString().split('T')[0]
    };

    const result = await addGasto(gastoData);
    if (result.success) {
      const deleteResult = await deleteCuentaPendiente(payment.id);
      if (deleteResult.success) {
        console.log(`Pago pendiente marcado como pagado y eliminado de cuentas pendientes.`);
        // Refrescar datos para actualizar la vista
        refreshData();
      }
    } else {
      alert("Error al marcar como pagado: " + result.error);
    }
  };

  // Modal para editar gasto
  const EditGastoModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Gasto</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const gastoData = {
            categoria: formData.get('categoria'),
            descripcion: formData.get('descripcion'),
            monto: parseFloat(formData.get('monto')),
            fecha: formData.get('fecha')
          };
          handleUpdateGasto(gastoData);
        }}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Categoría</label>
            <select
              name="categoria"
              defaultValue={editingGasto?.categoria}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
            <input
              type="text"
              name="descripcion"
              defaultValue={editingGasto?.descripcion}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Monto (S/.)</label>
            <input
              type="number"
              name="monto"
              defaultValue={editingGasto?.monto}
              step="0.01"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Fecha</label>
            <input
              type="date"
              name="fecha"
              defaultValue={editingGasto?.fecha}
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
  return (
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 border-b-4 border-orange-500 pb-2">
          <i className="fas fa-money-bill-wave text-orange-500 mr-3"></i>Gestión de Gastos
        </h1>

        {/* --- Sección de Cuentas Pendientes --- */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
            <i className="fas fa-hourglass-half text-gray-600 mr-2"></i>Cuentas Pendientes
          </h2>

          <button
            onClick={() => setShowAddPendingModal(true)}
            disabled={categorias.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-plus mr-2"></i> Añadir Nueva Cuenta Pendiente
          </button>

          {(cuentasPendientes || []).length === 0 ? (
            <p className="text-gray-500 mt-4">No hay pagos pendientes en este momento.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left rounded-tl-lg">Descripción</th>
                    <th className="py-3 px-6 text-left">Categoría</th>
                    <th className="py-3 px-6 text-left">Monto</th>
                    <th className="py-3 px-6 text-left">Vencimiento</th>
                    <th className="py-3 px-6 text-center rounded-tr-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {(cuentasPendientes || []).map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{payment.descripcion}</td>
                      <td className="py-3 px-6 text-left">{payment.categoria}</td>
                      <td className="py-3 px-6 text-left">S/.{parseFloat(payment.monto).toFixed(2)}</td>
                      <td className="py-3 px-6 text-left">{formatDate(payment.fecha_vencimiento)}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleMarkAsPaid(payment)}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                          >
                            Marcar Pagado
                          </button>
                          <button
                            onClick={() => handleDeletePendingPayment(payment)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- Formulario para Añadir Gasto Directo --- */}
        <div className="my-8">
          <FormularioGasto
            expenseCategories={expenseCategories}
            onAddExpense={handleAddExpense}
            isDisabled={categorias.length === 0}
          />
        </div>

        {/* --- Lista de Gastos Registrados --- */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gastos Registrados ({(gastos || []).length})</h2>
          {(gastos || []).length === 0 ? (
            <p className="text-gray-500">No hay gastos registrados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left rounded-tl-lg">Fecha</th>
                    <th className="py-3 px-6 text-left">Categoría</th>
                    <th className="py-3 px-6 text-left">Descripción</th>
                    <th className="py-3 px-6 text-left">Monto</th>
                    <th className="py-3 px-6 text-center rounded-tr-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {(gastos || []).map((gasto) => (
                    <tr key={gasto.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        {formatDate(gasto.fecha)}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {gasto.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-left">{gasto.descripcion}</td>
                      <td className="py-3 px-6 text-left font-semibold text-red-600">
                        S/.{parseFloat(gasto.monto).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditGasto(gasto)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteGasto(gasto.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- Modales --- */}
        {showAddPendingModal && (
          <AddPendingPaymentModal
            expenseCategories={expenseCategories}
            newPendingCategory={newPendingCategory}
            setNewPendingCategory={setNewPendingCategory}
            newPendingAmount={newPendingAmount}
            setNewPendingAmount={setNewPendingAmount}
            newPendingDescription={newPendingDescription}
            setNewPendingDescription={setNewPendingDescription}
            newPendingDueDate={newPendingDueDate}
            setNewPendingDueDate={setNewPendingDueDate}
            handleAddPendingPayment={handleAddPendingPayment}
            closeModal={() => {
              setShowAddPendingModal(false);
              setNewPendingCategory('');
              setNewPendingDescription('');
              setNewPendingAmount('');
              setNewPendingDueDate('');
            }}
          />
        )}

        {showEditModal && <EditGastoModal />}
      </div>
    );
}

export default GastosSection;