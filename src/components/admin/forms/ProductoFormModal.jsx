import React, { useState, useEffect } from 'react';
import useDashboard from '../../../hooks/useDashboard';

function ProductoFormModal({ product, onClose, onSave }) {
  const { productos } = useDashboard();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    stock: '',
    descripcion: ''
  });

  // Cuando el componente se carga, verifica si estamos editando un producto
  // Si es así, llena el formulario con sus datos.
  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre || '',
        categoria: product.categoria || '',
        precio: product.precio || '',
        stock: product.stock || '',
        descripcion: product.descripcion || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar que los campos numéricos sean correctos
    const dataToSend = {
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10)
    };

    if (isNaN(dataToSend.precio) || isNaN(dataToSend.stock)) {
      alert('El precio y el stock deben ser números válidos.');
      return;
    }
    onSave(dataToSend);
  };

  const productCategories = [...new Set((productos || []).map(p => p.categoria))];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {product ? 'Editar Producto' : 'Añadir Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Nombre del producto */}
          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-bold mb-2">Nombre del Producto</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full p-2 border rounded"/>
          </div>

          {/* Categoría */}
          <div className="mb-4">
            <label htmlFor="categoria" className="block text-sm font-bold mb-2">Categoría</label>
            <select name="categoria" value={formData.categoria} onChange={handleChange} required className="w-full p-2 border rounded">
                <option value="">Seleccione una categoría</option>
                {productCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="precio" className="block text-sm font-bold mb-2">Precio (S/.)</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} required step="0.01" className="w-full p-2 border rounded"/>
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-bold mb-2">Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required step="1" className="w-full p-2 border rounded"/>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label htmlFor="descripcion" className="block text-sm font-bold mb-2">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full p-2 border rounded"></textarea>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {product ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductoFormModal;