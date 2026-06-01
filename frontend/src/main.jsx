import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import IqacRoleRoute from './components/IqacRoleRoute.jsx';
import Login from './pages/Auth/Login.jsx';
import Dashboard from './components/Dashboard';
import NotFound from './components/NotFound';
import DynamicTablePage from './components/DynamicTablePage.jsx';
import IqacReports from './pages/IqacReports.jsx';
import { store } from './store/index.js';
import AddPage from './components/AddPage.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import LandingPage from './pages/Landing.jsx';
import FeedbackAnalysis from './pages/FeedbackAnalysis.jsx';
import AparForm from './pages/AparForm.jsx';
import AparLogin from './components/AparLogin.jsx';
import ProtectedAparRoute from './components/ProtectedAparRoute.jsx';
import ReportingDashboard from './pages/Apar/ReportingDashboard.jsx';
import OfficerDashboard from './pages/Apar/OfficerDashboard.jsx';
import AparProfile from './pages/Apar/Profile.jsx';
import DeanDashboard from './pages/Apar/DeanDashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';
import IqacApprovals from './pages/Apar/IqacApprovals.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/apar-form',
    element: (
      <ProtectedAparRoute>
        <AparForm />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/apar/login',
    element: <AparLogin />,
  },
  {
    path: '/apar/reporting',
    element: (
      <ProtectedAparRoute>
        <ReportingDashboard />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/apar/dean',
    element: (
      <ProtectedAparRoute>
        <DeanDashboard />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/apar/dashboard',
    element: (
      <ProtectedAparRoute>
        <OfficerDashboard />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/apar/profile',
    element: (
      <ProtectedAparRoute>
        <AparProfile />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/apar/iqac-approvals',
    element: (
      <ProtectedAparRoute>
        <IqacApprovals />
      </ProtectedAparRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/feedback-analysis',
    element: (
      <ProtectedRoute>
        <IqacRoleRoute>
          <FeedbackAnalysis />
        </IqacRoleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <IqacRoleRoute>
          <App />
        </IqacRoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tables/:resourceId', element: <DynamicTablePage /> },
      { path: 'reports', element: <IqacReports /> },
      { path: 'user-management', element: <UserManagement /> },
      { path: 'add/:resourceId', element: <AddPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </Provider>
  </React.StrictMode>
);
