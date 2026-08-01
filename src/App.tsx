import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, type PageKey } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { DeviceManagementPage } from './pages/DeviceManagementPage';
import { DepartmentSegmentPage } from './pages/DepartmentSegmentPage';
import { ApplicationManagementPage } from './pages/ApplicationManagementPage';
import { AccessEvaluationPage } from './pages/AccessEvaluationPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AccessLogsPage } from './pages/AccessLogsPage';
import { AIModelPage } from './pages/AIModelPage';
import { USBMonitorPage } from './pages/USBMonitorPage';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (!user) return <LoginPage />;

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {page === 'dashboard' && <DashboardPage />}
          {page === 'users' && <UserManagementPage />}
          {page === 'devices' && <DeviceManagementPage />}
          {page === 'departments' && <DepartmentSegmentPage />}
          {page === 'applications' && <ApplicationManagementPage />}
          {page === 'access-evaluation' && <AccessEvaluationPage />}
          {page === 'monitoring' && <MonitoringPage />}
          {page === 'usb-monitor' && <USBMonitorPage />}
          {page === 'logs' && <AccessLogsPage />}
          {page === 'ai-model' && <AIModelPage />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1a222c',
            color: '#e5e7eb',
            border: '1px solid rgba(71, 85, 105, 0.4)',
          }
        }} 
      />
    </AuthProvider>
  );
}
