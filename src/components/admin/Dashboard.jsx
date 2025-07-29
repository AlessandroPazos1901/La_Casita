import React from 'react';
import useDashboard from '../../hooks/useDashboard';

// Importar los componentes de las secciones
import DashboardSection from './sections/DashboardSection';
import PresupuestosSection from './sections/PresupuestosSection';
import GastosSection from './sections/GastosSection';
import ReporteDiaSection from './sections/ReporteDiaSection';

function Dashboard() {
  const { gastos, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-lg ml-4">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  // Convertir gastos al formato que espera DashboardSection
  const expenses = gastos.map(gasto => ({
    amount: gasto.monto,
    category: gasto.categoria,
    timestamp: gasto.created_at,
    // otros campos si son necesarios
  }));

  const budgets = []; // Usar datos reales de presupuestos si los tienes

  return (
    <div className="h-full">
      <DashboardSection expenses={expenses} budgets={budgets} />
    </div>
  );
}

export default Dashboard;