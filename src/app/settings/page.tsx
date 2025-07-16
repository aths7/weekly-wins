import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import Settings from '@/components/settings/Settings';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Settings />
      </MainLayout>
    </AuthGuard>
  );
}