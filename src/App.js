import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import Breadcrumbs from './components/Breadcrumbs';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/PrivateRoute'; 
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading'; // Fallback loading component

// Lazy-loaded components
const Home = React.lazy(() => import('./pages/Home'));
const ServiceRequestForm = React.lazy(() => import('./pages/ServicePage'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Footer = React.lazy(() => import('./pages/AboutPage'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const ClassTimetableManager = React.lazy(() => import('./pages/ClassTimetableManager'));
const Hssm = React.lazy(() => import('./pages/HSSM'));
const NotFound = React.lazy(() => import('../src/NotFound')); // 404 Page
const Total = React.lazy(() => import('./pages/Total'));
const Profile2FA = React.lazy(() => import('./pages/Profile2FA'));
// Add an Unauthorized page component (you'll need to create this simple page)
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage')); // <--- Create this component

// Updated MUI theme (keep your theme)
const theme = createTheme({
  palette: {
    primary: {
      main: '#0052cc',
    },
    secondary: {
      main: '#ff4081',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* AuthProvider should wrap everything related to auth/routing */}
        <AuthProvider>
          <Navbar />
          <Breadcrumbs language="en" />
          <ErrorBoundary>
            {/* Suspense wraps all lazy-loaded routes */}
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<Footer />} />
                <Route path="/total" element={<Total />} />
                {/* Route for unauthorized access */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                {/* User 2FA self-service page */}
                <Route path="/2fa" element={<Profile2FA />} />

                {/* --- Protected Routes --- */}

                {/* Group 1: Routes requiring login, but no specific role (like individual users) */}
                {/* The ProtectedRoute component without 'allowedRoles' just checks for login */}
                <Route element={<ProtectedRoute />}>
                  {/* Based on your Login.js, /service seems intended for logged-in users */}
                  <Route path="/service" element={<ServiceRequestForm />} />
                  {/* Add other general authenticated routes here if needed */}
                </Route>

                {/* Group 2: Routes requiring 'admin' role */}
                {/* Pass the required roles as an array to 'allowedRoles' */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'HOD']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin-panel" element={<AdminPanel />} />
                  <Route path="/class-timetable" element={<ClassTimetableManager />} />
                </Route>


                {/* Group 3: Routes requiring 'service-provider' or 'individual' role */}
                <Route element={<ProtectedRoute allowedRoles={['service-provider', 'individual']} />}> 
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Group 4: Routes requiring 'HSSM-provider' role */}
                <Route element={<ProtectedRoute allowedRoles={['HSSM-provider']} />}> 
                  <Route path="/hssm" element={<Hssm />} />
                </Route>

                {/* Catch-All Route for 404 Not Found - Must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;