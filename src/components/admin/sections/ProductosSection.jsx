import React, { useState } from 'react';
import useDashboard from '../../../hooks/useDashboard';
import ProductoFormModal from '../forms/ProductoFormModal'; 

// Cambiar el uso de alerte por react-toastify o sonner
function ProductosSection() {
  const { 
    productos, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useDashboard();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setShowModal(false);
  };

  const groupedProducts = (productos || []).reduce((acc, product) => {
    // Si la categoría aún no existe en el acumulador, la creamos
    if (!acc[product.categoria]) {
      acc[product.categoria] = [];
    }
    // Añadimos el producto a su categoría correspondiente
    acc[product.categoria].push(product);
    return acc;
  }, {});
  const productGroups = Object.entries(groupedProducts);

  const handleSaveProduct = async (productData) => {
    let result;
    if (editingProduct) {
      // Actualizar producto existente
      result = await updateProduct(editingProduct.id, productData);
    } else {
      // Crear nuevo producto
      result = await addProduct(productData);
    }

    if (result.success) {
      console.log('Producto guardado con éxito');
      handleCloseModal();
    } else {
      alert(`Error al guardar el producto: ${result.error}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto? Si ya ha sido usado en un pedido, solo se desactivará.')) {
      const result = await deleteProduct(productId);
      if (result.success) {
        console.log('Producto eliminado/desactivado con éxito');
      } else {
        alert(`Error al eliminar el producto: ${result.error}`);
      }
    }
  };

  if (loading) return <div className="text-lg text-center p-8">Cargando productos...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">Error: {error}</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Gestión de Productos
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
          + Añadir Producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Nombre</th>
              <th className="py-3 px-6 text-left">Categoría</th>
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
                    <td colSpan="6" className="py-2 px-6 font-bold text-gray-700 uppercase">
                    {category}
                    </td>
                </tr>
                
                {/* Mapeamos los productos que pertenecen a esta categoría */}
                {productsInCategory.map(product => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                        <span className="font-medium">{product.nombre}</span>
                    </td>
                    <td className="py-3 px-6 text-left">{product.categoria}</td>
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
                ))}
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
        />
      )}
    </div>
  );
}

export default ProductosSection;