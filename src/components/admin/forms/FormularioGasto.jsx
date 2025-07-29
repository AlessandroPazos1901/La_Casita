import React, { useState } from 'react';

function FormularioGasto({ expenseCategories, onAddExpense,isDisabled }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddExpense(category, description, amount, date);
    // Limpiar campos del formulario
    setCategory('');
    setDescription('');
    setAmount('');
    setDate('')
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Añadir Nuevo Gasto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="expenseCategory" className="block text-gray-700 text-sm font-bold mb-2">
            Categoría
          </label>
          <select
            id="expenseCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione una categoría</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expenseAmount" className="block text-gray-700 text-sm font-bold mb-2">
            Monto ($)
          </label>
          <input
            type="number"
            id="expenseAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: 50.75"
            step="0.01"
            required
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="expenseDescription" className="block text-gray-700 text-sm font-bold mb-2">
          Descripción
        </label>
        <input
          type="text"
          id="expenseDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Ej: Compra de vegetales frescos"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="expenseDate" className="block text-gray-700 text-sm font-bold mb-2">
            Fecha
          </label>
          <input
            type="date"
            id="expenseDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75"
      >
        Añadir Gasto
      </button>
      {isDisabled && (
        <p className="text-sm text-red-600 mt-2">
          Debe crear una categoría para poder añadir un gasto.
        </p>
      )}
    </form>
  );
}

export default FormularioGasto;
