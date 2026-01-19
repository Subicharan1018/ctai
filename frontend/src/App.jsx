import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BudgetBreakdown from './pages/BudgetBreakdown';
import ProjectSchedule from './pages/ProjectSchedule';
import MaterialsVendors from './pages/MaterialsVendors';

import { ProcurementProvider } from './context/ProcurementContext';

function App() {
  return (
    <BrowserRouter>
      <ProcurementProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/budget" element={<BudgetBreakdown />} />
          <Route path="/schedule" element={<ProjectSchedule />} />
          <Route path="/materials" element={<MaterialsVendors />} />
        </Routes>
      </ProcurementProvider>
    </BrowserRouter>
  );
}

export default App;
