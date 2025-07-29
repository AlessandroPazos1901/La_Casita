import React, { useState, useEffect } from 'react';

const CustomizeDishModal = ({ dish, onClose, onSave, availableStock }) => {
  const [individuals, setIndividuals] = useState(
    dish.individuals || [{ subId: Date.now(), notas: dish.notas || '' }]
  );
  const [quantity, setQuantity] = useState(dish.quantity || 1);
  const [loading, setLoading] = useState(false);

  const maxQuantity = dish.quantity + availableStock;

  useEffect(() => {
    // Bloquear scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
    // Función para actualizar las notas de un plato individual
    const updateIndividualNotes = (subId, newNotes) => {
    setIndividuals(prev => 
        prev.map(individual => 
        individual.subId === subId 
            ? { ...individual, notas: newNotes }
            : individual
        )
    );
    };

    // Función para eliminar un plato individual
    const removeIndividual = (subId) => {
    if (individuals.length > 1) {
        setIndividuals(prev => prev.filter(individual => individual.subId !== subId));
        setQuantity(prev => prev - 1);
    }
    };

    // Función para agregar un nuevo plato individual
    const addIndividual = () => {
    if (individuals.length < maxQuantity) {
        const newIndividual = {
        subId: Date.now() + Math.random(),
        notas: ''
        };
        setIndividuals(prev => [...prev, newIndividual]);
        setQuantity(prev => prev + 1);
    }
    };

    // Sincronizar quantity con la longitud de individuals
    React.useEffect(() => {
    setQuantity(individuals.length);
    }, [individuals.length]);
    const handleSave = async () => {
    setLoading(true);
    
    try {
        await onSave({ 
        ...dish, 
        quantity: individuals.length,
        individuals: individuals,
        notas: '' // Las notas están ahora en individuals
        });
        onClose();
    } catch (error) {
        console.error('Error al guardar:', error);
    } finally {
        setLoading(false);
    }
    };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Personalizar {dish.nombre}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información del producto */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-800">
              {dish.nombre}
            </span>
            <span className="text-lg font-bold text-blue-600">
              S/. {dish.precio}
            </span>
          </div>
          {dish.descripcion && (
            <p className="text-gray-600 text-sm">{dish.descripcion}</p>
          )}
        </div>

        {/* Lista de platos individuales */}
        <div className="mb-6">
        <label className="block text-gray-700 text-lg font-semibold mb-3">
            Notas individuales por plato:
        </label>
        <div className="space-y-3 max-h-60 overflow-y-auto">
            {individuals.map((individual, index) => (
            <div key={individual.subId} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">
                    Plato #{index + 1}
                </span>
                {individuals.length > 1 && (
                    <button
                    type="button"
                    onClick={() => removeIndividual(individual.subId)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 p-1"
                    >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                )}
                </div>
                <textarea
                rows="2"
                className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50"
                placeholder="Ej: Sin cebolla, extra picante..."
                value={individual.notas}
                onChange={(e) => updateIndividualNotes(individual.subId, e.target.value)}
                disabled={loading}
                />
            </div>
            ))}
        </div>
        
        {/* Botón para agregar más platos */}
        <button
            type="button"
            onClick={addIndividual}
            disabled={loading || individuals.length >= maxQuantity}
            className="mt-3 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            + Agregar otro plato
        </button>
        </div>

        {/* Subtotal */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">
              Subtotal:
            </span>
            <span className="text-xl font-bold text-blue-600">
              S/. {(dish.precio * quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full shadow-md transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </div>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeDishModal;