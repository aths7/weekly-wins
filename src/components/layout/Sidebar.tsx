'use client';

import { Home, Users, User, Settings, LogOut, PlusCircle, Shield, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import OrganizationSelector from '@/components/organizations/OrganizationSelector';
import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: PlusCircle, label: 'Submit Entry', href: '/dashboard/submit' },
  { icon: Users, label: 'Community', href: '/community' },
  { icon: Building2, label: 'Organizations', href: '/organizations' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { hasPermission } = useOrganizations();
  const [showCreateOrg, setShowCreateOrg] = useState(false);

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

      {/* Organization Selector */}
      <div className="p-4 border-b border-border">
        <OrganizationSelector onCreateNew={() => setShowCreateOrg(true)} />
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
        
        {/* Admin Link - Only show for organization admins */}
        {hasPermission('manage') && (
          <Link
            href="/admin/requests"
            className={cn(
              "nav-link w-full",
              pathname.startsWith('/admin') && "nav-link--active"
            )}
          >
            <Shield className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button onClick={signOut} className="nav-link w-full">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* Create Organization Modal */}
      {showCreateOrg && (
        <CreateOrganizationForm
          onClose={() => setShowCreateOrg(false)}
          onSuccess={() => {
            setShowCreateOrg(false);
            window.location.reload();
          }}
        />
      )}
    </aside>
  );
}