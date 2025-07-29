import React, { useState } from 'react';
import useDashboard from '../../../hooks/useDashboard';

function CategoriaManagement() {
  const { 
    categorias, 
    addCategoria, 
    updateCategoria, 
    deleteCategoria, 
    checkCategoriaUsage, 
    moveCategoriaData 
  } = useDashboard();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [deletingCategoria, setDeletingCategoria] = useState(null);
  const [categoryUsage, setCategoryUsage] = useState(null);
  const [moveToCategory, setMoveToCategory] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ];

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Por favor ingrese un nombre para la categoría');
      return;
    }

    const result = await addCategoria({
      nombre: newCategoryName.trim(),
      color: newCategoryColor
    });

    if (result.success) {
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setShowAddModal(false);
      alert('Categoría agregada correctamente');
    } else {
      alert('Error al agregar categoría: ' + result.error);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editingCategoria) return;

    const formData = new FormData(e.target);
    const nuevoNombre = formData.get('nombre').trim();
    const nuevoColor = formData.get('color');
    
    // Si el nombre no cambió, solo actualizar color
    if (nuevoNombre === editingCategoria.nombre) {
      const result = await updateCategoria(editingCategoria.id, {
        nombre: nuevoNombre,
        color: nuevoColor
      });

      if (result.success) {
        setShowEditModal(false);
        setEditingCategoria(null);
        alert('Categoría actualizada correctamente');
      } else {
        alert('Error al actualizar categoría: ' + result.error);
      }
      return;
    }

    // Si el nombre cambió, actualizar también gastos y presupuestos
    const moveResult = await moveCategoriaData(editingCategoria.nombre, nuevoNombre);
    if (!moveResult.success) {
      alert('Error al actualizar referencias: ' + moveResult.error);
      return;
    }

    const result = await updateCategoria(editingCategoria.id, {
      nombre: nuevoNombre,
      color: nuevoColor
    });

    if (result.success) {
      setShowEditModal(false);
      setEditingCategoria(null);
      alert('Categoría y todas sus referencias actualizadas correctamente');
    } else {
      alert('Error al actualizar categoría: ' + result.error);
    }
  };

  const handleDeleteClick = async (categoria) => {
    setDeletingCategoria(categoria);
    
    const usage = await checkCategoriaUsage(categoria.nombre);
    setCategoryUsage(usage);

    if (usage.hasUsage) {
      setShowMoveModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategoria) return;

    const result = await deleteCategoria(deletingCategoria.id, deletingCategoria.nombre);
    if (result.success) {
      setShowDeleteModal(false);
      setDeletingCategoria(null);
      alert('Categoría eliminada correctamente');
    } else {
      alert('Error al eliminar categoría: ' + result.error);
    }
  };

  const confirmMoveAndDelete = async () => {
    if (!deletingCategoria || !moveToCategory) {
      alert('Por favor seleccione una categoría destino');
      return;
    }

    // Mover datos
    const moveResult = await moveCategoriaData(deletingCategoria.nombre, moveToCategory);
    if (!moveResult.success) {
      alert('Error al mover datos: ' + moveResult.error);
      return;
    }

    // Eliminar categoría
    const deleteResult = await deleteCategoria(deletingCategoria.id, deletingCategoria.nombre);
    if (deleteResult.success) {
      setShowMoveModal(false);
      setDeletingCategoria(null);
      setMoveToCategory('');
      setCategoryUsage(null);
      alert('Categoría eliminada y datos movidos correctamente');
    } else {
      alert('Error al eliminar categoría: ' + deleteResult.error);
    }
  };

  const AddCategoryModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Agregar Nueva Categoría</h2>
        <form onSubmit={handleAddCategory}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: Transporte"
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Color</label>
            <div className="mb-2">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-8 rounded border"
              />
            </div>
            <div className="grid grid-cols-10 gap-1">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-6 h-6 rounded border-2 ${newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setNewCategoryName('');
                setNewCategoryColor('#3B82F6');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EditCategoryModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Categoría</h2>
        <form onSubmit={handleEditCategory}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
            <input
              type="text"
              name="nombre"
              defaultValue={editingCategoria?.nombre}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Color</label>
            <input
              type="color"
              name="color"
              defaultValue={editingCategoria?.color}
              className="w-full h-10 rounded border"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Actualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-red-600">Confirmar Eliminación</h2>
        <p className="mb-6">
          ¿Está seguro de que desea eliminar la categoría "<strong>{deletingCategoria?.nombre}</strong>"?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

const MoveDataModal = () => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
      <h2 className="text-xl font-bold mb-4 text-orange-600">Mover Datos</h2>
      <p className="mb-4">
        La categoría "<strong>{deletingCategoria?.nombre}</strong>" tiene datos asociados en:
      </p>
      <ul className="mb-4 text-sm">
        {categoryUsage?.hasGastos && <li>• Gastos registrados</li>}
        {categoryUsage?.hasPresupuestos && <li>• Presupuestos establecidos</li>}
        {categoryUsage?.hasCuentasPendientes && <li>• Cuentas pendientes</li>}
      </ul>
      <p className="mb-4">¿A qué categoría desea mover estos datos?</p>
      <select
        value={moveToCategory}
        onChange={(e) => setMoveToCategory(e.target.value)}
        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6"
        required
      >
        <option value="">Seleccione una categoría</option>
        {categorias
          .filter(cat => cat.nombre !== deletingCategoria?.nombre)
          .map(categoria => (
            <option key={categoria.id} value={categoria.nombre}>
              {categoria.nombre}
            </option>
          ))
        }
      </select>
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setShowMoveModal(false)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={confirmMoveAndDelete}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Mover y Eliminar
        </button>
      </div>
    </div>
  </div>
);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          <i className="fas fa-tags text-gray-600 mr-2"></i>Gestión de Categorías
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center"
        >
          + Agregar Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(categorias || []).map(categoria => (
          <div key={categoria.id} className="bg-white p-4 rounded-lg shadow-md border-l-4" 
               style={{ borderLeftColor: categoria.color }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{categoria.nombre}</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleDeleteClick(categoria)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-all duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && <AddCategoryModal />}
      {showEditModal && <EditCategoryModal />}
      {showDeleteModal && <DeleteModal />}
      {showMoveModal && <MoveDataModal />}
    </div>
  );
}

export default CategoriaManagement;