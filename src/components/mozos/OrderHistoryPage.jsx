// OrderHistoryPage.jsx

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrderHistory from '../../hooks/useOrderHistory';
import { useCurrentOrder } from '../../contexts/CurrentOrderContext';
import useMessages from '../../hooks/useMessages';
import MessageDisplay from '../auth/MessageDisplay';
import { useDataCache } from '../../contexts/DataCacheContext';
import { useReactToPrint } from 'react-to-print';
import { BoletaTermica } from '../shared/BoletaTermica';
import { useAuth } from '../../contexts/AuthContext';

const OrderHistoryPage = () => {
  const boletaRef = useRef(null);
  const {refreshCache} = useDataCache();
  const navigate = useNavigate();
  const { userRole, profile, userName } = useAuth();
  const { 
    ordersHistory, 
    loading, 
    error, 
    updateOrder,
    deleteOrder
  } = useOrderHistory(profile?.id, userRole);


  const { loadOrderForEditing } = useCurrentOrder();
  const { 
    message, 
    messageType, 
    showSuccess, 
    showError, 
    clearMessage 
  } = useMessages();

  const [filterStatus, setFilterStatus] = useState('pendiente');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('oldest');
  
  // Estados para modal de cobro
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderToPay, setSelectedOrderToPay] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  
  // Estados para impresión de boleta
  const [orderToPrint, setOrderToPrint] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Configurar react-to-print
  const reactToPrintFn = useReactToPrint({
    contentRef: boletaRef,
    documentTitle: `Boleta-Mesa-${orderToPrint?.mesa || 'Sin-Mesa'}`,
    onAfterPrint: () => {
      console.log('Impresión completada');
      setShowPrintModal(false);
      setOrderToPrint(null);
    },
    onPrintError: (errorLocation, error) => {
      console.error('Error al imprimir:', errorLocation, error);
      showError('Error al imprimir la boleta');
    },
    onBeforePrint: () => {
      console.log('Preparando impresión...');
      return Promise.resolve();
    },
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `
  });

  // Función para manejar el clic en imprimir
  const handlePrintClick = useCallback(() => {
    console.log('=== Debug de impresión ===');
    console.log('1. boletaRef:', boletaRef);
    console.log('2. boletaRef.current:', boletaRef.current);
    console.log('3. orderToPrint:', orderToPrint);
    
    if (boletaRef.current && orderToPrint) {
      // Llamar a la función sin esperar un return
      reactToPrintFn();
    } else {
      console.error('No se puede imprimir: ref o orden no disponible');
      showError('Error al preparar la impresión');
    }
  }, [reactToPrintFn, orderToPrint]);

  React.useEffect(() => {
    if (error) {
      showError(`Error al cargar el historial: ${error}`);
    }
  }, [error]);


  const handleDeleteOrder = async (orderToDelete) => {
    // Siempre pedir confirmación para acciones destructivas.
    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar permanentemente el pedido ${orderToDelete.numero_pedido} de la mesa ${orderToDelete.mesa}?\n\nEsta acción no se puede deshacer y el stock de los productos será restaurado.`
    );

    if (isConfirmed) {
      const result = await deleteOrder(orderToDelete.id);
      if (result.success) {
        showSuccess('Pedido eliminado correctamente y stock restaurado.');
        refreshCache(); // Refrescamos el caché global
      } else {
        showError(result.error || 'Error al eliminar el pedido.');
      }
    }
  };
  const handleMarkPaid = (order) => {
    setSelectedOrderToPay(order);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPaymentMethod) {
      showError('Por favor selecciona un método de pago');
      return;
    }
    
    const updates = {
      estado: 'pagado',
      metodo_pago: selectedPaymentMethod
    };
    
    const result = await updateOrder(selectedOrderToPay.id, updates);

    if (result.success && result.data) {
      // Cerrar modal de pago
      setShowPaymentModal(false);
      setSelectedOrderToPay(null);
      setSelectedPaymentMethod('');
      
      // Preparar para impresión
      console.log('Iniciando proceso de impresión para orden:', result.data);
      setOrderToPrint(result.data);
      setShowPrintModal(true);
      
      refreshCache();
    } else {
      showError(result.error || 'Error al procesar el pago');
    }
  };

  const handleAddMore = (orderToEdit) => {
    const result = loadOrderForEditing(orderToEdit);
    if (result.success) {
      showSuccess(`Pedido de la mesa ${orderToEdit.mesa} cargado. Puedes agregar más items.`);
      navigate('/menu');
    } else {
      showError(result.error || 'Error al cargar el pedido para edición');
    }
  };

  const getFilteredOrders = () => {
    let filtered = [...ordersHistory];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.estado === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'amount':
        filtered.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'pagado':
        return 'Pagado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'efectivo':
        return 'Efectivo';
      case 'pos':
        return 'POS';
      case 'yape_plin':
        return 'Yape/Plin';
      default:
        return method || 'No especificado';
    }
  };

  const getOrderCreator = (order) => {
    if (order.usuario && order.usuario.nombre) {
      return order.usuario.nombre;
    }
    return 'Sistema';
  };

  const filteredOrders = getFilteredOrders();
  const todayStats = {
    totalOrders: ordersHistory.length,
    pendingOrders: ordersHistory.filter(o => o.estado === 'pendiente').length,
    paidOrders: ordersHistory.filter(o => o.estado === 'pagado').length,
    totalSales: ordersHistory
      .filter(o => o.estado === 'pagado')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <MessageDisplay 
        message={message} 
        type={messageType} 
        onClose={clearMessage} 
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-4 border-b border-gray-200">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Historial de Pedidos - Hoy
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            {(userRole === 'admin' || userRole === 'cajero')
              ? `Administrador - ${todayStats.totalOrders} pedidos hoy` 
              : `${userName || 'Usuario'} - ${todayStats.totalOrders} pedidos hoy`
            }
          </p>
        </div>
        
        {userRole !== 'admin' && userRole === 'cajero' &&(
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/menu')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
            >
              Volver al Menú
            </button>
          </div>
        )}
        {userRole === 'admin' && (
          <button
            onClick={() => navigate('/dashboard-section')}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-5 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
          >
            📊 Dashboard
          </button>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos de Hoy</p>
              <p className="text-2xl font-bold text-blue-600">{todayStats.totalOrders}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{todayStats.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              ⏳
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-2xl font-bold text-green-600">{todayStats.paidOrders}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>
        
        {(userRole === 'admin' || userRole === 'cajero') &&(
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas de Hoy</p>
                <p className="text-2xl font-bold text-purple-600">S/. {todayStats.totalSales.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                💰
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por mesa o número de pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagados</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="amount">Por monto</option>
          </select>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg font-medium">
              {ordersHistory.length === 0 
                ? 'No hay pedidos hoy' 
                : 'No se encontraron pedidos con los filtros aplicados'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {ordersHistory.length === 0 
                ? 'Los pedidos de hoy aparecerán aquí'
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => {
              const itemsTotal = order.pedido_items?.reduce(
                (sum, item) => sum + (item.cantidad * item.precio_unitario), 0
              ) || 0;
            
              // Comparamos el total de la orden con la suma de los productos
              const deliveryFee = parseFloat(order.total) - itemsTotal;
              return (
              <div 
                key={order.id} 
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Header del pedido */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Mesa: {order.mesa}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.estado)}`}>
                    {getStatusText(order.estado)}
                  </span>
                </div>

                {/* Información del pedido */}
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Pedido:</span> {order.numero_pedido}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Fecha:</span> {formatDate(order.created_at)}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-medium">Atendido por:</span> {order.atendido_por || 'Sistema'}
                  </p>
                  {order.servicio === 'delivery' || order.servicio === 'recojo' && (
                    <p className="text-gray-600 text-sm mb-3">
                      <span className="font-medium">Celular:</span> {order.celular || 'No proporcionado'}
                    </p>
                  )}
                  {order.servicio === 'delivery' && (
                    <p className="text-gray-600 text-sm mb-3">
                      <span className="font-medium">Dirección:</span> {order.direccion}
                    </p>
                  )}
                  {order.estado === 'pagado' && order.metodo_pago && (
                    <p className="text-gray-600 text-sm mb-3">
                      <span className="font-medium">Método de pago:</span> {getPaymentMethodText(order.metodo_pago)}
                    </p>
                  )}
                </div>

                {/* Items del pedido */}
                <div className="mb-4 flex-grow">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    Detalle del Pedido:
                  </h4>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {order.pedido_items?.map((item, idx) => {
                      let notasIndividuales = [];
                      try {
                        const parsedNotas = JSON.parse(item.notas);
                        if (Array.isArray(parsedNotas)) {
                          notasIndividuales = parsedNotas;
                        }
                      } catch (e) {
                        if (typeof item.notas === 'string' && item.notas) {
                          notasIndividuales = [item.notas];
                        }
                      }

                      return (
                        <li key={idx} className="text-gray-700 text-sm border-b border-gray-100 pb-2 mb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.producto?.nombre || 'Producto'} (x{item.cantidad})</span>
                            <span className="text-green-600 font-medium">
                              S/. {(item.precio_unitario * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                          
                          {notasIndividuales.length > 0 && (
                            <div className="pl-4 mt-1">
                              {notasIndividuales.map((nota, notaIdx) => (
                                <p key={notaIdx} className="text-xs text-purple-700 italic">
                                  - {nota}
                                </p>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {/* ÍTEM VIRTUAL: Mostramos el delivery si existe */}
                    {deliveryFee > 0.01 && (
                      <li className="text-gray-700 text-sm border-b border-gray-100 pb-2 mb-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-blue-600">Delivery</span>
                          <span className="text-green-600 font-medium">
                            S/. {deliveryFee.toFixed(2)}
                          </span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Total y acciones */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-blue-700">
                      Total: S/. {parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {order.estado === 'pendiente' && (
                      <button
                        onClick={() => handleAddMore(order)}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                      >
                        Añadir más
                      </button>
                    )}
                    {(order.estado === 'pendiente' && userRole === 'admin' || userRole === 'cajero') && (
                      <button
                        onClick={() => handleMarkPaid(order)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                      >
                        Cobrar
                      </button>
                    )}
                    {/* --- BOTÓN AÑADIDO --- */}
                    {/* Puede estar pendiente o pagado, pero solo para el admin */}
                    {(userRole === 'admin' || userRole === 'cajero') && (
                      <button
                        onClick={() => handleDeleteOrder(order)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-full shadow-md transform transition-all duration-300 hover:scale-105"
                      >
                        Eliminar
                      </button>
                    )}
                    
                    {order.estado === 'pagado' && (
                      <div className="flex-1 text-center py-2 text-green-600 font-semibold">
                        ✅ Pedido completado
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de selección de método de pago */}
      {showPaymentModal && selectedOrderToPay && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Cobrar Pedido - Mesa {selectedOrderToPay.mesa}
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <strong>Total a cobrar:</strong> S/. {parseFloat(selectedOrderToPay.total).toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Método de Pago:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="efectivo"
                    checked={selectedPaymentMethod === 'efectivo'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-medium">💵 Efectivo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pos"
                    checked={selectedPaymentMethod === 'pos'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-blue-600 font-medium">💳 POS</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="yape_plin"
                    checked={selectedPaymentMethod === 'yape_plin'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-purple-600 font-medium">📱 Yape/Plin</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderToPay(null);
                  setSelectedPaymentMethod('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPayment}
                disabled={!selectedPaymentMethod}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de post-pago para imprimir */}
      {showPrintModal && orderToPrint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-sm">
            <h2 className="text-2xl font-bold text-green-600 mb-4">¡Pago Exitoso!</h2>
            <p className="mb-6">
              El pedido de la mesa <strong>{orderToPrint.mesa}</strong> ha sido completado.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setOrderToPrint(null);
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintClick}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                <span className="mr-2">📄</span> Imprimir Boleta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de boleta siempre renderizado pero oculto */}
      <div style={{ 
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: '288px',
        overflow: 'hidden'
      }}>
        <BoletaTermica ref={boletaRef} order={orderToPrint} />
      </div>
    </div>
  );
};

export default OrderHistoryPage;