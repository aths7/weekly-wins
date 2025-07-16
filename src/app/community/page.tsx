import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import CommunityBoard from '@/components/community/CommunityBoard';

export default function CommunityPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <CommunityBoard />
      </MainLayout>
    </AuthGuard>
  );
}