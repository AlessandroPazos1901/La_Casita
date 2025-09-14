import React, { useState, useEffect } from 'react';
import useDashboard from '../../../hooks/useDashboard';

function ProductoFormModal({ product, onClose, onSave, menuType, availableCategories }) {
  const { productos } = useDashboard();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    categoria_noche: '',
    precio: '',
    stock: '',
    descripcion: '',
    tipo_carta: menuType === 'noche' ? 'noche' : 'dia'
  });

  // Cuando el componente se carga, verifica si estamos editando un producto
  // Si es así, llena el formulario con sus datos.
  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre ?? '',
        categoria: product.categoria ?? '',
        categoria_noche: product.categoria_noche ?? '',
        precio: product.precio ?? '',
        stock: product.stock ?? '',
        descripcion: product.descripcion ?? '',
        tipo_carta: product.tipo_carta ?? (menuType === 'noche' ? 'noche' : 'dia')
      });
    } else {
      // Aseguramos que el formulario se vacíe si es para crear uno nuevo
      setFormData({
        nombre: '',
        categoria: '',
        categoria_noche: '',
        precio: '',
        stock: '',
        descripcion: '',
        tipo_carta: menuType === 'noche' ? 'noche' : 'dia'
      });
    }
  }, [product, menuType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Determinar qué campo de categoría debe estar lleno según el tipo de carta
    let categoryField, categoryValue;
    if (menuType === 'noche') {
      categoryField = 'categoria_noche';
      categoryValue = formData.categoria_noche;
    } else {
      categoryField = 'categoria';
      categoryValue = formData.categoria;
    }

    // 1. Verificamos que los campos obligatorios no estén vacíos
    if (!formData.nombre.trim() || !categoryValue?.trim() || formData.precio === '') {
      alert(`Por favor, complete todos los campos obligatorios (Nombre, Categoría, Precio).`);
      return;
    }

    // 2. Convertimos los valores a los tipos de datos correctos
    const dataToSend = {
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10) || 0
    };

    // 3. Verificamos que el precio sea un número válido y no sea negativo
    if (isNaN(dataToSend.precio) || dataToSend.precio < 0) {
      alert('El precio debe ser un número válido y no puede ser negativo.');
      return;
    }

    // Si todas las validaciones pasan, llamamos a la función de guardado
    onSave(dataToSend);
  };

  // Usar las categorías pasadas como prop, con fallback a categorías existentes
  const productCategories = availableCategories || [];

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
            <label htmlFor="categoria" className="block text-sm font-bold mb-2">
              Categoría {menuType === 'noche' ? '(Noche)' : '(Día)'}
            </label>
            <select
              name={menuType === 'noche' ? 'categoria_noche' : 'categoria'}
              value={menuType === 'noche' ? formData.categoria_noche : formData.categoria}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
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
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} step="1" className="w-full p-2 border rounded" placeholder="0"/>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label htmlFor="descripcion" className="block text-sm font-bold mb-2">Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full p-2 border rounded"></textarea>
          </div>

          {/* Campo oculto para tipo de carta */}
          <input type="hidden" name="tipo_carta" value={menuType === 'noche' ? 'noche' : 'dia'} />

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