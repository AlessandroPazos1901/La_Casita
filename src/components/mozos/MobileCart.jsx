import React, { useEffect } from 'react';
import useScrollLock from '../../hooks/useScrollLock';

const MobileCart = ({ 
  isOpen, 
  onClose, 
  currentOrder, 
  totalPrice, 
  tableNumber, 
  setTableNumber, 
  onSendOrder, 
  onRemoveItem, 
  onEditItem, 
  editingOrderId,
  loading = false
}) => {
  // Usar el hook de scroll lock
  useScrollLock(isOpen);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendOrder = () => {
    onSendOrder();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden modal-overlay touch-optimized"
          onClick={handleOverlayClick}
        />
      )}

      {/* Carrito deslizable */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden touch-optimized ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className="text-xl font-bold text-gray-800">Pedido Actual</h2>
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

          {/* Número de mesa */}
          <div className="p-4 border-b bg-gray-50">
            <label htmlFor="mobileTableNumber" className="block text-gray-700 text-sm font-semibold mb-2">
              Número de Mesa:
            </label>
            <input
              type="text"
              id="mobileTableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ej: 5, A1, Barra"
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Items del pedido */}
          <div className="flex-1 overflow-y-auto p-4 mobile-scroll-container touch-scroll">
            {currentOrder.length === 0 ? (
              <div className="text-center py-12">
                {/* ... (tu mensaje de carrito vacío no cambia) ... */}
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.map((item) => {
                  // --- 1. LÓGICA AÑADIDA: Obtenemos las notas válidas ---
                  const itemNotes = item.individuals
                    .map(individual => individual.notes || individual.notas || '')
                    .filter(note => note && note.trim() !== '');

                  return (
                    <div key={item.orderId} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {item.nombre}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Cantidad: {item.quantity}
                          </p>

                          {/* --- 2. JSX MODIFICADO: Mostramos las notas como una lista --- */}
                          {itemNotes.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                              <ul className="list-disc list-inside pl-2 space-y-1">
                                {itemNotes.map((note, index) => (
                                  <li key={index} className="text-sm text-purple-700 italic">
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-3">
                          <button
                            onClick={() => onEditItem(item)}
                            disabled={loading}
                            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full ..."
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.109 10.928A4 4 0 017.5 15.5H4a1 1 0 01-1-1v-3.5a4 4 0 01-.072-1.072l6.216-6.216 2.828 2.828-6.216 6.216z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.orderId)}
                            disabled={loading}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full ..."
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          S/. {item.precio} x {item.quantity}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          S/. {(item.precio * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total y botón de envío */}
          <div className="border-t p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-blue-700">
                S/. {totalPrice.toFixed(2)}
              </span>
            </div>
            
            <button
              onClick={handleSendOrder}
              disabled={currentOrder.length === 0 || loading || !tableNumber.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </div>
              ) : (
                editingOrderId ? 'Actualizar Pedido' : 'Enviar Pedido'
              )}
            </button>
            
            {/* Información adicional */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {currentOrder.length} producto{currentOrder.length !== 1 ? 's' : ''} en el pedido
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileCart;