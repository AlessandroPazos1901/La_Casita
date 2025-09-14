import React, { useState, useEffect } from 'react';
import { products, nightProducts } from '../../services/supabaseClient';

const CategoryManagementModal = ({ 
  isOpen, 
  onClose, 
  onCategoriesUpdated,
  dayCategories = [],
  nightCategories = []
}) => {
  const [activeTab, setActiveTab] = useState('dia');
  const [categories, setCategories] = useState({ dia: [], noche: [] });
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategories({
        dia: [...dayCategories],
        noche: [...nightCategories]
      });
    }
  }, [isOpen, dayCategories, nightCategories]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const trimmedName = newCategoryName.trim();
      
      // Verificar que no exista ya
      if (categories[activeTab].includes(trimmedName)) {
        alert('Esta categoría ya existe');
        return;
      }

      // Guardar en base de datos
      let result;
      if (activeTab === 'dia') {
        result = await products.addDayCategory(trimmedName);
      } else {
        result = await nightProducts.addNightCategory(trimmedName);
      }

      if (result.error) {
        alert(`Error al agregar la categoría: ${result.error}`);
        return;
      }

      // Actualizar estado local
      const updatedCategories = {
        ...categories,
        [activeTab]: [...categories[activeTab], trimmedName].sort()
      };
      
      setCategories(updatedCategories);
      setNewCategoryName('');
      
      console.log(`✅ Categoría "${trimmedName}" agregada a carta ${activeTab}`);
      
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      alert('Error al agregar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (categoryName) => {
    setEditingCategory(categoryName);
    setNewCategoryName(categoryName);
  };

  const handleSaveEdit = async () => {
    if (!newCategoryName.trim() || !editingCategory) return;

    setLoading(true);
    try {
      const trimmedName = newCategoryName.trim();
      
      // Verificar que no exista ya (excepto la que estamos editando)
      if (trimmedName !== editingCategory && categories[activeTab].includes(trimmedName)) {
        alert('Esta categoría ya existe');
        return;
      }

      // Actualizar en base de datos
      let result;
      if (activeTab === 'dia') {
        result = await products.updateDayCategoryName(editingCategory, trimmedName);
      } else {
        result = await nightProducts.updateNightCategoryName(editingCategory, trimmedName);
      }

      if (result.error) {
        alert(`Error al editar la categoría: ${result.error}`);
        return;
      }

      // Actualizar estado local
      const updatedCategories = {
        ...categories,
        [activeTab]: categories[activeTab].map(cat => 
          cat === editingCategory ? trimmedName : cat
        ).sort()
      };
      
      setCategories(updatedCategories);
      setEditingCategory(null);
      setNewCategoryName('');
      
      console.log(`✅ Categoría "${editingCategory}" → "${trimmedName}" actualizada en carta ${activeTab}`);
      
    } catch (error) {
      console.error('Error al editar categoría:', error);
      alert('Error al editar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"?\n\nEsto desactivará todos los productos que usan esta categoría.`)) {
      return;
    }

    setLoading(true);
    try {
      // Eliminar en base de datos (desactivar productos)
      let result;
      if (activeTab === 'dia') {
        result = await products.deleteDayCategory(categoryName);
      } else {
        result = await nightProducts.deleteNightCategory(categoryName);
      }

      if (result.error) {
        alert(`Error al eliminar la categoría: ${result.error}`);
        return;
      }

      // Actualizar estado local
      const updatedCategories = {
        ...categories,
        [activeTab]: categories[activeTab].filter(cat => cat !== categoryName)
      };
      
      setCategories(updatedCategories);
      
      console.log(`✅ Categoría "${categoryName}" eliminada de carta ${activeTab}`);
      
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = () => {
    // Notificar cambios al componente padre
    onCategoriesUpdated(categories);
    onClose();
  };

  const currentCategories = categories[activeTab];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Gestionar Categorías
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Administra las categorías de ambas cartas
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dia')}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'dia' 
                  ? 'bg-yellow-500 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              ☀️ Categorías del Día ({categories.dia.length})
            </button>
            <button
              onClick={() => setActiveTab('noche')}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'noche' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌙 Categorías de la Noche ({categories.noche.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">
              {editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    editingCategory ? handleSaveEdit() : handleAddCategory();
                  }
                }}
              />
              {editingCategory ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading || !newCategoryName.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategoryName('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCategory}
                  disabled={loading || !newCategoryName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
                >
                  Agregar
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">
              Categorías {activeTab === 'dia' ? 'del Día' : 'de la Noche'}
            </h4>
            
            {currentCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">
                  {activeTab === 'dia' ? '☀️' : '🌙'}
                </div>
                No hay categorías configuradas para esta carta
              </div>
            ) : (
              <div className="space-y-2">
                {currentCategories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="font-medium text-gray-800">{category}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded"
                        disabled={loading}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded"
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              disabled={loading}
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;