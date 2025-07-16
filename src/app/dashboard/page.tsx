import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <div className="text-sm text-muted-foreground">
              Welcome back!
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
              <h3 className="font-semibold text-lg mb-2">This Week</h3>
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">Wins recorded</p>
            </div>
            
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
              <h3 className="font-semibold text-lg mb-2">Total Entries</h3>
              <p className="text-2xl font-bold text-success">12</p>
              <p className="text-sm text-muted-foreground">Weekly submissions</p>
            </div>
            
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
              <h3 className="font-semibold text-lg mb-2">Streak</h3>
              <p className="text-2xl font-bold text-info">4</p>
              <p className="text-sm text-muted-foreground">Consecutive weeks</p>
            </div>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="font-medium">You submitted your weekly entry</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="font-medium">You reached a 4-week streak</p>
                  <p className="text-sm text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}