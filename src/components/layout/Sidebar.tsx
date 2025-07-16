'use client';

import { Home, Users, User, Settings, LogOut, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: PlusCircle, label: 'Submit Entry', href: '/dashboard/submit' },
  { icon: Users, label: 'Community', href: '/community' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className={cn(
      "w-64 bg-card border-r border-border flex flex-col",
      className
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="text-2xl">🏆</div>
          <span className="font-bold text-xl">Weekly Wins</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-link w-full",
                isActive && "nav-link--active"
              )}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button onClick={signOut} className="nav-link w-full">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}