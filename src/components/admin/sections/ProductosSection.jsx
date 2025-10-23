import React, { useState, useEffect } from 'react';
import useDashboard from '../../../hooks/useDashboard';
import ProductoFormModal from '../forms/ProductoFormModal';
import ConfirmationModal from '../../shared/ConfirmationModal';
import CategorySelectionModal from '../../shared/CategorySelectionModal';
import CategoryManagementModal from '../../shared/CategoryManagementModal';
import { useMenuType } from '../../../contexts/MenuTypeContext';
import useMessages from '../../../hooks/useMessages';
import { products, nightProducts } from '../../../services/supabaseClient'; 

// Cambiar el uso de alerte por react-toastify o sonner
function ProductosSection() {
  const { 
    productos, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    refreshData 
  } = useDashboard();
  
  const { menuType, updateMenuType } = useMenuType();
  const { showSuccess, showError } = useMessages();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMenuType, setPendingMenuType] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pendingCartaType, setPendingCartaType] = useState(null);
  const [nightCategories, setNightCategories] = useState([]);
  const [dayCategories, setDayCategories] = useState([]);
  const [loadingCartaChange, setLoadingCartaChange] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Cargar categorías de día y noche al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Cargar categorías de día
      const dayResult = await products.getDayCategories();
      if (dayResult.data) {
        setDayCategories(dayResult.data);
      }

      // Cargar categorías de noche
      const nightResult = await nightProducts.getNightCategories();
      if (nightResult.data) {
        setNightCategories(nightResult.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleMenuTypeChange = (newMenuType) => {
    setPendingMenuType(newMenuType);
    setShowConfirmModal(true);
  };

  const confirmMenuTypeChange = async () => {
    if (!pendingMenuType) return;
    
    const newMenuName = pendingMenuType === 'dia' ? 'Carta del Día' : 'Carta de la Noche';
    
    const result = await updateMenuType(pendingMenuType);
    if (result.success) {
      showSuccess(`Menú cambiado exitosamente a "${newMenuName}"`);
    } else {
      showError(`Error al cambiar el tipo de menú: ${result.error}`);
    }
    
    setPendingMenuType(null);
  };

  // Función para manejar actualización de categorías desde el modal de gestión
  const handleCategoriesUpdated = async (updatedCategories) => {
    setDayCategories(updatedCategories.dia || []);
    setNightCategories(updatedCategories.noche || []);
    
    // Recargar tanto las categorías como los productos para reflejar cambios
    await Promise.all([
      loadCategories(),
      refreshData() // Esto recarga todos los productos
    ]);
    
    showSuccess('Categorías actualizadas exitosamente');
  };

  // Función para obtener tipo de carta real del producto
  const getProductCartaType = (product) => {
    return product.tipo_carta || 'dia'; // Default a 'dia' si no está definido
  };

  // Función para manejar cambio de tipo de carta de producto
  const handleCartaTypeChange = (productId, newCartaType) => {
    const product = productos?.find(p => p.id === productId);
    if (!product) return;

    setSelectedProduct(product);
    setPendingCartaType(newCartaType);
    setShowCategoryModal(true);
  };

  // Función para confirmar cambio con categorías seleccionadas
  const handleCategoryConfirm = async (categories) => {
    if (!selectedProduct || !pendingCartaType) return;

    setLoadingCartaChange(true);

    try {
      // Preparar los datos de actualización
      const updateData = {
        tipo_carta: pendingCartaType,
      };

      // Actualizar categorías según el tipo de carta
      if (pendingCartaType === 'dia') {
        updateData.categoria = categories.dia || selectedProduct.categoria;
        // Limpiar categoria_noche si solo es para día
        updateData.categoria_noche = null;
      } else if (pendingCartaType === 'noche') {
        updateData.categoria_noche = categories.noche || selectedProduct.categoria_noche;
        // Limpiar categoria de día si solo es para noche
        updateData.categoria = null;
      } else if (pendingCartaType === 'ambos') {
        // Para ambos, necesitamos ambas categorías
        updateData.categoria = categories.dia || selectedProduct.categoria;
        updateData.categoria_noche = categories.noche || selectedProduct.categoria_noche;
      }

      const result = await updateProduct(selectedProduct.id, updateData);

      if (!result.success) {
        showError(`Error al actualizar el producto: ${result.error}`);
        return;
      }

      // Mostrar mensaje de éxito
      const tipoTexto = pendingCartaType === 'dia' ? 'Carta del Día' :
                       pendingCartaType === 'noche' ? 'Carta de la Noche' :
                       'Ambas Cartas';

      showSuccess(`${selectedProduct.nombre} asignado a ${tipoTexto} exitosamente`);

      // Recargar datos para reflejar los cambios
      await refreshData();

    } catch (error) {
      showError(`Error inesperado: ${error.message}`);
    } finally {
      setLoadingCartaChange(false);
      // Limpiar estado
      setShowCategoryModal(false);
      setSelectedProduct(null);
      setPendingCartaType(null);
    }
  };

  // Obtener todas las categorías disponibles según el tipo de menú
  const getAllCategories = () => {
    if (menuType === 'noche') {
      return nightCategories;
    } else {
      return dayCategories;
    }
  };

  // Filtrar productos según el tipo de menú actual
  const getFilteredProducts = () => {
    if (!productos) return [];

    if (menuType === 'noche') {
      // Para carta nocturna: mostrar productos que sean 'noche' o 'ambos'
      // Si tipo_carta es null/undefined, tratarlo como 'dia' por defecto
      return productos.filter(product =>
        product.tipo_carta === 'noche' || product.tipo_carta === 'ambos'
      );
    } else {
      // Para carta diurna: mostrar productos que sean 'dia', 'ambos' o null/undefined (default)
      return productos.filter(product =>
        product.tipo_carta === 'dia' ||
        product.tipo_carta === 'ambos' ||
        !product.tipo_carta ||
        product.tipo_carta === null
      );
    }
  };

  // Agrupar productos por categoría
  const allCategories = getAllCategories();
  let productGroups;

  // Si no hay categorías cargadas, usar un enfoque de respaldo basado en productos existentes
  if (allCategories.length === 0 && productos && productos.length > 0) {
    const fallbackGrouped = getFilteredProducts().reduce((acc, product) => {
      const categoryToUse = (product.tipo_carta === 'ambos' && menuType === 'noche') 
        ? (product.categoria_noche || product.categoria)
        : product.categoria;
      
      if (!acc[categoryToUse]) {
        acc[categoryToUse] = [];
      }
      acc[categoryToUse].push({
        ...product,
        categoria: categoryToUse
      });
      return acc;
    }, {});
    
    productGroups = Object.entries(fallbackGrouped);
  } else {
    // Usar categorías de la base de datos (incluyendo categorías vacías)
    const groupedProducts = allCategories.reduce((acc, categoria) => {
      // Inicializar cada categoría con array vacío
      acc[categoria] = [];
      return acc;
    }, {});

    // Llenar las categorías con productos filtrados
    getFilteredProducts().forEach(product => {
      // Determinar qué categoría usar según el tipo de carta y el menú actual
      let categoryToUse;

      if (menuType === 'noche') {
        // Para carta nocturna: usar categoria_noche si existe, sino categoria como fallback
        categoryToUse = product.categoria_noche || product.categoria;
      } else {
        // Para carta diurna: usar categoria
        categoryToUse = product.categoria;
      }

      if (categoryToUse && groupedProducts[categoryToUse]) {
        groupedProducts[categoryToUse].push({
          ...product,
          categoria: categoryToUse // Asegurar que muestre la categoría correcta
        });
      }
    });

    productGroups = Object.entries(groupedProducts);
  }
  
  // Debug logs
  // console.log('Debug ProductosSection:', {
  //   menuType,
  //   totalProducts: productos?.length || 0,
  //   filteredProducts: getFilteredProducts().length,
  //   dayCategories: dayCategories.length,
  //   nightCategories: nightCategories.length,
  //   allCategories: getAllCategories(),
  //   productGroups: productGroups.map(([cat, prods]) => ({ category: cat, count: prods.length })),
  //   sampleProducts: productos?.slice(0, 5).map(p => ({
  //     nombre: p.nombre,
  //     categoria: p.categoria,
  //     tipo_carta: p.tipo_carta,
  //     tipo_carta_type: typeof p.tipo_carta,
  //     categoria_noche: p.categoria_noche
  //   })),
  //   // Análisis de tipos de carta
  //   tipoCartaDistribution: productos?.reduce((acc, p) => {
  //     const tipo = p.tipo_carta || 'null_undefined';
  //     acc[tipo] = (acc[tipo] || 0) + 1;
  //     return acc;
  //   }, {})
  // });

  const handleSaveProduct = async (productData) => {
    // Convertir menuType al valor correcto para la base de datos
    const tipoCartaDb = menuType === 'dia' ? 'dia' : menuType === 'noche' ? 'noche' : 'dia';

    // Asegurar que el tipo de carta esté establecido correctamente
    const dataWithCartaType = {
      ...productData,
      tipo_carta: tipoCartaDb
    };

    let result;
    if (editingProduct) {
      // Actualizar producto existente
      result = await updateProduct(editingProduct.id, dataWithCartaType);
    } else {
      // Crear nuevo producto
      result = await addProduct(dataWithCartaType);
    }

    if (result.success) {
      // console.log('Producto guardado con éxito');
      handleCloseModal();
      // Recargar datos para mostrar cambios
      await refreshData();
    } else {
      alert(`Error al guardar el producto: ${result.error}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto? Si ya ha sido usado en un pedido, solo se desactivará.')) {
      const result = await deleteProduct(productId);
      if (result.success) {
        // console.log('Producto eliminado/desactivado con éxito');
      } else {
        alert(`Error al eliminar el producto: ${result.error}`);
      }
    }
  };

  if (loading) return <div className="text-lg text-center p-8">Cargando productos...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">Error: {error}</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-800">
          Gestión de Productos
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => setShowCategoryManagement(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="hidden sm:inline">Gestionar Categorías</span>
            <span className="sm:hidden">Categorías</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md text-sm sm:text-base"
          >
            <span className="sm:hidden">+ Producto</span>
            <span className="hidden sm:inline">+ Añadir Producto</span>
          </button>
        </div>
      </div>

      {/* Toggle Carta Día/Noche - Responsive */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-full p-1 flex">
          <button
            onClick={() => handleMenuTypeChange('dia')}
            className={`px-3 sm:px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 flex items-center space-x-0 sm:space-x-2 ${
              menuType === 'dia'
                ? 'bg-yellow-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">☀️</span>
            <span className="hidden sm:inline ml-2">Carta del Día</span>
          </button>
          <button
            onClick={() => handleMenuTypeChange('noche')}
            className={`px-3 sm:px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 flex items-center space-x-0 sm:space-x-2 ${
              menuType === 'noche'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">🌙</span>
            <span className="hidden sm:inline ml-2">Carta de la Noche</span>
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-4 text-left w-48">Nombre</th>
              <th className="py-3 px-6 text-left">Categoría</th>
              <th className="py-3 px-6 text-center">Tipo de Carta</th>
              <th className="py-3 px-6 text-center">Precio</th>
              <th className="py-3 px-6 text-center">Stock</th>
              <th className="py-3 px-6 text-center">Estado</th>
              <th className="py-3 px-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {productGroups.map(([category, productsInCategory]) => (
                <React.Fragment key={category}>
                {/* Fila que actúa como encabezado de la categoría */}
                <tr className="bg-gray-100 sticky top-0">
                    <td colSpan="7" className="py-2 px-6 font-bold text-gray-700 uppercase">
                    {category}
                    </td>
                </tr>
                
                {/* Mapeamos los productos que pertenecen a esta categoría */}
                {productsInCategory.map(product => {
                    const currentCartaType = getProductCartaType(product);
                    return (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-left w-48">
                        <span className="font-medium break-words">{product.nombre}</span>
                    </td>
                    <td className="py-3 px-6 text-left">{product.categoria}</td>
                    <td className="py-3 px-6 text-center">
                        <select
                            value={currentCartaType}
                            onChange={(e) => handleCartaTypeChange(product.id, e.target.value)}
                            disabled={loadingCartaChange}
                            className={`bg-white border border-gray-300 rounded-md text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                                loadingCartaChange ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <option value="dia">☀️ Día</option>
                            <option value="noche">🌙 Noche</option>
                            <option value="ambos">🌞 Ambos</option>
                        </select>
                    </td>
                    <td className="py-3 px-6 text-center font-semibold">S/. {product.precio.toFixed(2)}</td>
                    <td className="py-3 px-6 text-center">{product.stock}</td>
                    <td className="py-3 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.activo ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center space-x-2">
                        <button 
                            onClick={() => handleOpenModal(product)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs"
                        >
                            Editar
                        </button>
                        <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs"
                        >
                            Eliminar
                        </button>
                        </div>
                    </td>
                    </tr>
                    );
                })}
                </React.Fragment>
            ))}
            </tbody>
        </table>
      </div>

      {showModal && (
        <ProductoFormModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          menuType={menuType}
          availableCategories={getAllCategories()}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingMenuType(null);
        }}
        onConfirm={confirmMenuTypeChange}
        title="Confirmar Cambio de Menú"
        message={pendingMenuType ? 
          `¿Estás seguro de cambiar a "${pendingMenuType === 'dia' ? 'Carta del Día' : 'Carta de la Noche'}"?\n\nEsto afectará a todos los usuarios del sistema y los mozos deberán actualizar sus páginas manualmente.` 
          : ''
        }
        confirmText="Sí, cambiar menú"
        cancelText="Cancelar"
        confirmButtonClass="bg-yellow-500 hover:bg-yellow-600"
        icon={pendingMenuType === 'dia' ? '☀️' : '🌙'}
      />

      <CategorySelectionModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedProduct(null);
          setPendingCartaType(null);
        }}
        onConfirm={handleCategoryConfirm}
        productName={selectedProduct?.nombre || ''}
        menuType={pendingCartaType}
        currentCategory={selectedProduct?.categoria || ''}
        dayCategories={dayCategories}
        nightCategories={nightCategories}
        onCategoriesUpdated={handleCategoriesUpdated}
      />

      <CategoryManagementModal
        isOpen={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        onCategoriesUpdated={handleCategoriesUpdated}
        dayCategories={dayCategories}
        nightCategories={nightCategories}
      />
    </div>
  );
}

export default ProductosSection;