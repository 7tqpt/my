import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import Properties from './pages/Properties';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import UtilityBills from './pages/UtilityBills';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="owners" element={<Owners />} />
        <Route path="properties" element={<Properties />} />
        <Route path="units" element={<Units />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="utilities" element={<UtilityBills />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
        <Route path="profile/:resource/:id" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;
