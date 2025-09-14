// MenuPage.jsx - Optimizado para móvil
import React, { useState, useMemo, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import useMenuItems from '../../hooks/useMenuItems';
import { useCurrentOrder } from '../../contexts/CurrentOrderContext'; 
import useMessages from '../../hooks/useMessages';
import MessageDisplay from '../auth/MessageDisplay';
import CollapsibleCategory from './CollapsibleCategory';
import CustomizeDishModal from './CustomizeDishModal';
import MobileCart from './MobileCart';
import { Comanda } from '../shared/Comanda';
import { useReactToPrint } from 'react-to-print';
import usePrint from '../../hooks/usePrint';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuType } from '../../contexts/MenuTypeContext';
 

const MenuPage = () => {
  const navigate = useNavigate();
   const { userRole, profile, userName } = useAuth();
   const { menuType } = useMenuType();
  const { 
    menuItems, 
    loading: menuLoading, 
    error: menuError,
    updateLocalStock 
  } = useMenuItems();
  const {
    originalOrderItems,
    calcularCambiosPedido,
    currentOrder,
    tableNumber,
    editingOrderId,
    loading: orderLoading,
    error: orderError,
    clearOrderError,
    addToOrder,
    removeItemFromOrder,
    updateOrderItem,
    sendOrder,
    setTableNumber,
    totalPrice,
    totalItems,
    isEmpty,
    isEditing,
    clearCurrentOrder,
  } = useCurrentOrder();
  
  const {
    message,
    messageType,
    showSuccess,
    showError,
    clearMessage
  } = useMessages();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedDishToCustomize, setSelectedDishToCustomize] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(new Set())
  const comandaRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: comandaRef,
  });
  const { 
    printOrder, 
    isLoading: isPrinting,
    error: printError 
  } = usePrint();
  const categories = useMemo(() => {
    // Obtener las categorías ya organizadas por useMenuItems
    return menuItems.map(cat => cat.category);
  }, [menuItems]);
  
  const handleCancelEditing = () => {
    clearCurrentOrder(); // Limpia el pedido actual
    navigate('/historial-pedidos'); // Regresa al historial de pedidos
  };


  const filteredItems = useMemo(() => {
    const allItems = menuItems.flatMap(cat => cat.items);

    if (searchTerm.trim()) {
      return allItems.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allItems.filter(item => {
      // Para carta de noche, usar categoria_noche si existe, sino categoria
      // Para carta del día, usar categoria
      const itemCategory = menuType === 'noche'
        ? (item.categoria_noche || item.categoria)
        : item.categoria;

      return itemCategory === selectedCategory;
    });
  }, [menuItems, selectedCategory, searchTerm, menuType]);

  // Mostrar errores de los hooks
  React.useEffect(() => {
    if (menuError) {
      showError(`Error al cargar el menú: ${menuError}`);
    }
  }, [menuError, showError]);

  React.useEffect(() => {
    if (orderError) {
      showError(orderError);
      clearOrderError();
    }
  }, [orderError, showError, clearOrderError]);

  // Seleccionar "Menu" por defecto cuando se cargan las categorías
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const menuCategory = categories.find(cat => cat.toLowerCase() === 'menu');
      if (menuCategory) {
        setSelectedCategory(menuCategory);
      } else {
        // Si no existe "Menu", seleccionar la primera categoría disponible
        setSelectedCategory(categories[0]);
      }
    }
  }, [categories, selectedCategory]);
  const handleAddToOrder = async (item) => {
    const result = await addToOrder(item);
    if (result.success) {
      // updateLocalStock({ 
      //   id: item.id, 
      //   stock: item.stock - 1 
      // });
    showSuccess(`${item.nombre} agregado al pedido`);
    } else {
      showError(result.error || 'Error al agregar al pedido');
    }
  };

  const handleRemoveFromOrder = async (orderId) => {
    const result = await removeItemFromOrder(orderId);
    if (result.success) {
      // const removedItem = currentOrder.find(item => item.orderId === orderId);
      // if (removedItem) {
      //   const menuItem = menuItems.flatMap(cat => cat.items).find(item => item.id === removedItem.id);
      //   if (menuItem) {
      //     updateLocalStock({ 
      //       id: removedItem.id, 
      //       stock: menuItem.stock + removedItem.quantity 
      //     });
      //   }
      // }
      showSuccess('Producto eliminado del pedido');
    } else {
      showError(result.error || 'Error al eliminar del pedido');
    }
  };

  const handleSendOrder = async () => {
    const result = await sendOrder();
    if (result.success) {
      showSuccess(
        isEditing 
          ? `¡Pedido de la mesa ${tableNumber} actualizado con éxito!`
          : `¡Pedido para mesa ${tableNumber} enviado con éxito!`
      );
      
      const orderData = {
        mesa: tableNumber,
        created_at: new Date().toISOString(),
        mozo: userName,
        pedido_items: currentOrder
      };
      
      console.log('Is editing:', isEditing);
      console.log('Editing order ID:', editingOrderId);
      console.log('Has original items:', !!originalOrderItems);

      // Calcular cambios si es edición
      console.log('Original items:', originalOrderItems);
      console.log('Current items:', currentOrder);
      console.log('Changes calculated:', calcularCambiosPedido(originalOrderItems, currentOrder));
      const changesData = (isEditing && originalOrderItems) ? calcularCambiosPedido(originalOrderItems, currentOrder) : null;

      // NUEVA LÓGICA: Impresión térmica automática
      try {
        console.log('Enviando a impresión térmica...');
        await printOrder(orderData, changesData);
        console.log('✅ Impresión térmica exitosa');
      } catch (printErr) {
        console.error('❌ Error en impresión térmica:', printErr);
        // Mostrar error pero no bloquear el flujo
        showError(`Pedido enviado correctamente, pero hubo un problema con la impresión: ${printErr.message}`);
      }
      setMobileCartOpen(false);
    } else {
      showError(result.error || 'Error al procesar el pedido');
    }
  };

  const openCustomizeModal = (dish) => {
    const menuItem = menuItems
      .flatMap(category => category.items)
      .find(item => item.id === dish.id);
    
    setSelectedDishToCustomize({ 
      ...dish, 
      availableStock: menuItem ? menuItem.stock : 0 
    });
    setShowCustomizeModal(true);
    setMobileCartOpen(false);
  };
  const handleAddToOrderWithLoading = async (item) => {
  // Marcar producto como loading
  setLoadingProducts(prev => new Set(prev).add(item.id));
  
  try {
    const result = await addToOrder(item);
    if (result.success) {
      showSuccess(`${item.nombre} agregado al pedido`);
    } else {
      showError(result.error || 'Error al agregar al pedido');
    }
  } finally {
    // Remover loading después de un pequeño delay
    setTimeout(() => {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 500);
  }
};

  const saveCustomizedDish = async (updatedDish) => {
    const result = await updateOrderItem(updatedDish);
    if (result.success) {
      showSuccess('Producto actualizado en el pedido');
    } else {
      showError(result.error || 'Error al actualizar el producto');
    }
  };

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MessageDisplay 
        message={message} 
        type={messageType} 
        onClose={clearMessage} 
      />
      
      {/* Contenido principal */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Área del menú */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header del menú (solo desktop) */}
          <div className={`p-6 hidden lg:block bg-white ${userRole === 'admin' ? 'pt-20' : ''}`}>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">
                  Menú del Restaurante
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  {isEditing && '(Editando pedido)'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {userRole !== 'admin' && userRole !== 'cajero' && (
                  <button
                    onClick={() => navigate('/historial-pedidos')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                  >
                    Ver Historial
                  </button>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={() => navigate('/dashboard-section')}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-5 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                  >
                    📊 Dashboard
                  </button>
                )}
                {userRole === 'cajero' && (
                  <button
                    onClick={() => navigate('/productos')}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-5 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                  >
                    📊 Productos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Header móvil */}
          {userRole === 'admin' && (
          <div className="lg:hidden bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menú</h1>
                <p className="text-sm text-gray-600">
                  {isEditing && '(Editando)'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {userRole !== 'admin'  && userRole !== 'cajero' && (
                  <button
                    onClick={() => navigate('/historial-pedidos')}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-full"
                  >
                    Historial
                  </button>
                )}
                {userRole === 'admin'  && (
                  <button
                    onClick={() => navigate('/dashboard-section')}
                    className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-3 py-2 rounded-full"
                  >
                    📊
                  </button>
                )}
                {userRole === 'cajero'  && (
                  <button
                    onClick={() => navigate('/productos')}
                    className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-3 py-2 rounded-full"
                  >
                    📊
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* Barra de búsqueda y filtros - STICKY mejorada */}
          <div className={`sticky ${userRole === 'admin' ? 'top-16' : 'top-0'} ${userRole === 'admin' ? 'lg:top-16' : 'lg:top-0'} bg-white shadow-sm z-20 px-4 lg:px-6 py-4`}>
            {/* Barra de búsqueda */}
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />


            {/* Botones de categoría - Scroll horizontal en móvil */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 font-semibold rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                    selectedCategory === category && !searchTerm.trim()
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje de edición */}
          {isEditing && (
            <div className="px-4 lg:px-6 py-2">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Estás editando el pedido de la mesa {tableNumber}
                </p>
              </div>
              {/* Botón "Cancelar Edición" */}
              <div className="mt-4">
                <button
                  onClick={handleCancelEditing}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                >
                  Cancelar Edición
                </button>
              </div>
            </div>
          )}
          
          {/* Grid de productos - Área con scroll */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pb-20 lg:pb-4 lg:min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white p-4 lg:p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-800 leading-tight">
                          {item.nombre}
                        </h3>
                        <span className="text-lg lg:text-xl font-bold text-blue-600 ml-2 flex-shrink-0">
                          S/. {item.precio}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base mb-4 line-clamp-3">
                        {item.descripcion}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                      <span className={`px-3 py-1 rounded-full text-xs lg:text-sm font-semibold flex-shrink-0 ${
                        item.stock > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.stock > 0 ? `Stock: ${item.stock}` : 'Agotado'}
                      </span>
                      
                      <button
                        onClick={() => handleAddToOrderWithLoading(item)}
                        disabled={item.stock <= 0 || loadingProducts.has(item.id)}
                        className={`font-bold py-2 px-4 rounded-full text-sm lg:text-base shadow-md transform transition-all duration-300 hover:scale-105 ml-2 ${
                          item.stock > 0 && !loadingProducts.has(item.id)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {loadingProducts.has(item.id) ? 'Agregando...' : (item.stock > 0 ? 'Agregar' : 'No disponible')}
                    </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">
                    {menuType === 'noche' ? '🌙' : '🍽️'}
                  </div>
                  <p className="text-gray-500 text-lg">
                    {menuType === 'noche' 
                      ? (menuItems.length === 0 
                          ? 'Aún no hay productos configurados para la carta de la noche'
                          : 'No hay productos en esta categoría de la carta nocturna'
                        )
                      : searchTerm.trim() 
                        ? 'No se encontraron productos que coincidan con tu búsqueda'
                        : 'No hay productos en esta categoría'
                    }
                  </p>
                  {searchTerm.trim() && menuType === 'dia' && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito lateral (solo desktop) - ARREGLADO */}
        <div className="hidden lg:flex flex-col w-96 bg-white shadow-xl border-l border-gray-200 h-full relative">
          {/* 1. Header del carrito (tamaño fijo) */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedido Actual</h2>
            <div>
              <label htmlFor="tableNumber" className="block text-gray-700 text-sm font-semibold mb-2">Número de Mesa:</label>
              <input
                type="text"
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ej: 5, A1, Barra"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Items del pedido - área con scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {isEmpty ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🛒</div>
                <p className="text-gray-500">No hay elementos en el pedido</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrder.map((item) => {
                  // --- 1. LÓGICA AÑADIDA: Obtenemos las notas que no están vacías ---
                  const itemNotes = item.individuals
                    .map(individual => individual.notes || individual.notas || '')
                    .filter(note => note && note.trim() !== '');

                  return (
                    <div key={item.orderId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {item.nombre} (x{item.quantity})
                          </p>
                          
                          {/* --- 2. JSX MODIFICADO: Mostramos las notas como una lista --- */}
                          {itemNotes.length > 0 && (
                            <ul className="list-disc list-inside pl-1 mt-1">
                              {itemNotes.map((note, index) => (
                                <li key={index} className="text-sm text-purple-700 italic">
                                  {note}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openCustomizeModal(item)}
                            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-md ..."
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.109 10.928A4 4 0 017.5 15.5H4a1 1 0 01-1-1v-3.5a4 4 0 01-.072-1.072l6.216-6.216 2.828 2.828-6.216 6.216z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveFromOrder(item.orderId)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md ..."
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-blue-600 font-bold text-right mt-2">
                        S/. {(item.precio * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total y botón de envío - SIEMPRE VISIBLE */}
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-xl font-bold text-blue-700">S/. {totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSendOrder}
              disabled={isEmpty || orderLoading || !tableNumber.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {orderLoading ? 'Procesando...' : isEditing ? 'Actualizar Pedido' : 'Enviar Pedido'}
            </button>
          </div>
        </div>
      </div>

      {/* Carrito móvil */}
      <MobileCart
        isOpen={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        currentOrder={currentOrder}          
        totalPrice={totalPrice}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        onSendOrder={handleSendOrder}
        onRemoveItem={handleRemoveFromOrder}
        onEditItem={openCustomizeModal}
        editingOrderId={editingOrderId}
        loading={orderLoading}
      />

      {/* Modal de personalización */}
      {showCustomizeModal && selectedDishToCustomize && (
        <CustomizeDishModal
          dish={selectedDishToCustomize}
          onClose={() => setShowCustomizeModal(false)}
          onSave={saveCustomizedDish}
          availableStock={selectedDishToCustomize.availableStock}
        />
      )}

      {/* Botón flotante del carrito para móvil - Mejorado */}
      <button
        onClick={() => setMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transform transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 3H3m4 10v4a2 2 0 002 2h8a2 2 0 002-2v-4M9 17h6" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold animate-pulse">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

    </div>
  );
};

export default MenuPage;