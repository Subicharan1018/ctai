import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BudgetBreakdown from './pages/BudgetBreakdown';
import ProjectSchedule from './pages/ProjectSchedule';
import MaterialsVendors from './pages/MaterialsVendors';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/budget" element={<BudgetBreakdown />} />
        <Route path="/schedule" element={<ProjectSchedule />} />
        <Route path="/materials" element={<MaterialsVendors />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
