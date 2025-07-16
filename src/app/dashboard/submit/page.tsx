import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import WeeklyEntryForm from '@/components/weekly-entry/WeeklyEntryForm';

export default function SubmitPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <WeeklyEntryForm />
      </MainLayout>
    </AuthGuard>
  );
}