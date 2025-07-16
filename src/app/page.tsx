import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">🏆</div>
            <span className="font-bold text-xl">Weekly Wins</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login" className="btn-outline">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="text-6xl sm:text-8xl mb-6">🏆</div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-gradient">
            Track Your Weekly Wins
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A team productivity app where you celebrate achievements,
            share progress, and build momentum together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
              Start Tracking Wins
            </Link>
            <Link href="/community" className="btn-outline text-lg px-8 py-4">
              View Community
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Weekly Reflections</h3>
            <p className="text-muted-foreground">
              Track your wins, learnings, and challenges every week
            </p>
          </div>

          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Team Community</h3>
            <p className="text-muted-foreground">
              See what your teammates are working on and celebrate together
            </p>
          </div>

          <div className="text-center p-6 bg-card rounded-lg border border-border">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-muted-foreground">
              Build streaks and monitor your growth over time
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-muted-foreground space-y-2">

            <p className="text-sm">
              Built with ❤️ by{' '}
              <a
                href="https://github.com/aths7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Atharva Wankhede
              </a>
            </p>
            <p>&copy; 2025 Weekly Wins. Built with Next.js and Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}