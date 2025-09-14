import React, { useState } from 'react';
import CategoryManagementModal from './CategoryManagementModal';

const CategorySelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName,
  menuType, // 'dia', 'noche', o 'ambos'
  currentCategory,
  dayCategories = [], // Categorías de día pasadas como prop
  nightCategories = [], // Categorías de noche pasadas como prop
  onCategoriesUpdated // Callback para actualizar categorías
}) => {
  const [selectedDayCategory, setSelectedDayCategory] = useState(currentCategory || '');
  const [selectedNightCategory, setSelectedNightCategory] = useState(currentCategory || '');
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Usar categorías reales de la base de datos, con fallbacks si están vacías
  const dayCategoriesList = dayCategories.length > 0 ? dayCategories : 
    ['Desayuno', 'Almuerzo', 'Bebidas', 'Postres', 'Aperitivos', 'Menu'];
  const nightCategoriesList = nightCategories.length > 0 ? nightCategories : 
    ['Cena', 'Bebidas Nocturnas', 'Cocktails', 'Tapas', 'Postres Gourmet'];

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    let categories = {};
    
    if (menuType === 'dia') {
      categories.dia = selectedDayCategory;
    } else if (menuType === 'noche') {
      categories.noche = selectedNightCategory;
    } else if (menuType === 'ambos') {
      categories.dia = selectedDayCategory;
      categories.noche = selectedNightCategory;
    }
    
    onConfirm(categories);
  };

  const isValid = () => {
    if (menuType === 'dia') return selectedDayCategory;
    if (menuType === 'noche') return selectedNightCategory;
    if (menuType === 'ambos') return selectedDayCategory && selectedNightCategory;
    return false;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <div className="text-4xl">
                  {menuType === 'dia' ? '☀️' : menuType === 'noche' ? '🌙' : '🌞'}
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900">
                  Seleccionar Categoría
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Producto: <span className="font-medium">{productName}</span>
                </p>
              </div>
            </div>
            
            {/* Botón de gestión de categorías */}
            <button
              onClick={() => setShowCategoryManagement(true)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-100 flex items-center space-x-1"
              title="Gestionar categorías"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Gestionar</span>
            </button>
          </div>

          {/* Selección de categorías */}
          <div className="space-y-4 mb-6">
            {(menuType === 'dia' || menuType === 'ambos') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ☀️ Categoría para Carta del Día
                </label>
                <select
                  value={selectedDayCategory}
                  onChange={(e) => setSelectedDayCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría...</option>
                  {dayCategoriesList.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(menuType === 'noche' || menuType === 'ambos') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌙 Categoría para Carta de la Noche
                </label>
                <select
                  value={selectedNightCategory}
                  onChange={(e) => setSelectedNightCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría...</option>
                  {nightCategoriesList.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800 mb-1">
              {menuType === 'ambos' 
                ? 'Este producto aparecerá en ambas cartas con las categorías seleccionadas.'
                : `Este producto aparecerá solo en la carta ${menuType === 'dia' ? 'del día' : 'de la noche'}.`
              }
            </p>
            {/* Indicador de categorías cargadas */}
            <p className="text-xs text-gray-600">
              Categorías día: {dayCategories.length > 0 ? `${dayCategories.length} desde BD` : 'valores por defecto'} • 
              Categorías noche: {nightCategories.length > 0 ? `${nightCategories.length} desde BD` : 'valores por defecto'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid()}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isValid()
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de gestión de categorías */}
      <CategoryManagementModal
        isOpen={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        onCategoriesUpdated={(updatedCategories) => {
          // Notificar al componente padre para actualizar las categorías
          if (onCategoriesUpdated) {
            onCategoriesUpdated(updatedCategories);
          }
          setShowCategoryManagement(false);
        }}
        dayCategories={dayCategories}
        nightCategories={nightCategories}
      />
    </div>
  );
};

export default CategorySelectionModal;