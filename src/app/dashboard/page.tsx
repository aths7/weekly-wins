import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </AuthGuard>
  );
}