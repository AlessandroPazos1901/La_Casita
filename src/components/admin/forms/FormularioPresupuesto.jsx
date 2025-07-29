import React, { useState } from 'react';

const FormularioPresupuesto = ({ onSaveBudget, expenseCategories, onCancel }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveBudget) {  // Verificar que existe la función
      onSaveBudget(category, amount);
    }
    setCategory('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Establecer/Actualizar Presupuesto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="budgetCategory" className="block text-gray-700 text-sm font-bold mb-2">
            Categoría
          </label>
          <select
            id="budgetCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione una categoría</option>
            {(expenseCategories || []).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budgetAmount" className="block text-gray-700 text-sm font-bold mb-2">
            Monto del Presupuesto ($)
          </label>
          <input
            type="number"
            id="budgetAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: 1000.00"
            step="0.01"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75"
      >
        Guardar Presupuesto
      </button>
    </form>
  );
}

export default FormularioPresupuesto;