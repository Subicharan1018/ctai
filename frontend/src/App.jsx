import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BudgetBreakdown from './pages/BudgetBreakdown';
import ProjectSchedule from './pages/ProjectSchedule';
import MaterialsVendors from './pages/MaterialsVendors';
import Login from './pages/Login';
import Signup from './pages/Signup';

import { ProcurementProvider, useProcurement } from './context/ProcurementContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useProcurement();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ProcurementProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/budget" element={
            <ProtectedRoute>
              <BudgetBreakdown />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <ProjectSchedule />
            </ProtectedRoute>
          } />
          <Route path="/materials" element={
            <ProtectedRoute>
              <MaterialsVendors />
            </ProtectedRoute>
          } />
        </Routes>
      </ProcurementProvider>
    </BrowserRouter>
  );
}

export default App;
