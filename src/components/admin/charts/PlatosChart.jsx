import React from 'react';

function PlatosChart({ platosData, periodo, chartType, title }) {
  // Encontrar el valor máximo para escalar las barras
  const maxCantidad = Math.max(...platosData.map(plato => plato.cantidad), 1);
  
  // Colores para las barras - diferentes para más/menos vendidos
  const coloresMasVendidos = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9'
  ];
  
  const coloresMenosVendidos = [
    '#FCA5A5', '#FED7AA', '#FEF3C7', '#FEF08A', '#D9F99D',
    '#BBF7D0', '#A7F3D0', '#99F6E4', '#A5F3FC', '#BFDBFE'
  ];
  
  const colores = chartType === 'mas-vendidos' ? coloresMasVendidos : coloresMenosVendidos;

  if (platosData.length === 0) {
    return (
      <div className="mb-10 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          <i className="fas fa-chart-bar text-gray-600 mr-2"></i>
          {title}
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No hay datos de ventas para el período seleccionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
        <i className="fas fa-chart-bar text-gray-600 mr-2"></i>
        {title}
      </h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          {platosData.map((plato, index) => {
            const porcentaje = (plato.cantidad / maxCantidad) * 100;
            const color = colores[index % colores.length];
            
            return (
              <div key={plato.nombre} className="flex items-center">
                {/* Número de posición */}
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 mr-4">
                  {index + 1}
                </div>
                
                {/* Nombre del plato */}
                <div className="w-1/3 pr-4">
                  <h3 className="font-semibold text-gray-800 text-sm">{plato.nombre}</h3>
                </div>
                
                {/* Barra de progreso */}
                <div className="flex-1 mr-4">
                  <div className="w-full bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ 
                        width: `S/.{Math.max(porcentaje, 10)}%`,
                        backgroundColor: color
                      }}
                    >
                      <span className="text-white text-xs font-medium">
                        {plato.cantidad}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Estadísticas */}
                <div className="w-32 text-right">
                  <div className="text-sm font-bold text-gray-800">
                    {plato.cantidad} unidades
                  </div>
                  <div className="text-xs text-gray-600">
                    S/.{plato.ingresos.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumen */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {platosData.reduce((sum, plato) => sum + plato.cantidad, 0)}
              </div>
              <div className="text-sm text-blue-600">Platos Vendidos</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                S/.{platosData.reduce((sum, plato) => sum + plato.ingresos, 0).toFixed(2)}
              </div>
              <div className="text-sm text-green-600">Ingresos por Platos</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {platosData.length}
              </div>
              <div className="text-sm text-purple-600">Platos Diferentes</div>
            </div>
          </div>
        </div>
        
        {/* Insights */}
        {platosData.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg border-l-4 ${
            chartType === 'mas-vendidos' ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'
          }`}>
            <h4 className={`font-semibold mb-2 S/.{
              chartType === 'mas-vendidos' ? 'text-green-800' : 'text-orange-800'
            }`}>
              💡 Insights {chartType === 'mas-vendidos' ? '(Más Populares)' : '(Menos Populares)'}
            </h4>
            <div className={`text-sm ${
              chartType === 'mas-vendidos' ? 'text-green-700' : 'text-orange-700'
            }`}>
              <p className="mb-1">
                • <strong>{platosData[0]?.nombre}</strong> {chartType === 'mas-vendidos' ? 'es tu plato más popular' : 'es el menos vendido'} con <strong>{platosData[0]?.cantidad} unidades</strong>
              </p>
              {chartType === 'mas-vendidos' && platosData.length >= 3 && (
                <p className="mb-1">
                  • Los top 3 platos representan <strong>
                    {Math.round(((platosData[0]?.cantidad + platosData[1]?.cantidad + platosData[2]?.cantidad) / 
                    platosData.reduce((sum, plato) => sum + plato.cantidad, 0)) * 100)}%
                  </strong> de las ventas
                </p>
              )}
              {chartType === 'menos-vendidos' && (
                <p className="mb-1">
                  • Considera promocionar estos platos o revisar la receta/precio
                </p>
              )}
              <p>
                • Promedio en esta lista: <strong>
                  {Math.round(platosData.reduce((sum, plato) => sum + plato.cantidad, 0) / platosData.length)} unidades
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlatosChart;