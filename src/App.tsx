import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Policies } from './pages/Policies';
import { DetectionEngine } from './pages/DetectionEngine';
import { AIApps } from './pages/AIApps';
import { ActivityLogs } from './pages/ActivityLogs';
import { UsersRoles } from './pages/UsersRoles';
import { CustomPatterns } from './pages/CustomPatterns';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { BrowserExtension } from './pages/BrowserExtension';

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Route element={<DashboardLayout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/detection" element={<DetectionEngine />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/ai-apps" element={<AIApps />} />
      <Route path="/custom-patterns" element={<CustomPatterns />} />
      <Route path="/logs" element={<ActivityLogs />} />
      <Route path="/users" element={<UsersRoles />} />
      <Route path="/extension" element={<BrowserExtension />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/detection" element={<DetectionEngine />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/ai-apps" element={<AIApps />} />
        <Route path="/custom-patterns" element={<CustomPatterns />} />
        <Route path="/logs" element={<ActivityLogs />} />
        <Route path="/users" element={<UsersRoles />} />
        <Route path="/extension" element={<BrowserExtension />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
