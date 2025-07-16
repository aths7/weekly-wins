import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import UserProfile from '@/components/user/UserProfile';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <MainLayout>
        <UserProfile />
      </MainLayout>
    </AuthGuard>
  );
}