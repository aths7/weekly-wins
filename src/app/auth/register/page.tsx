import RegisterForm from '@/components/auth/RegisterForm';
import AuthGuard from '@/components/auth/AuthGuard';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <RegisterForm />
      </div>
    </AuthGuard>
  );
}