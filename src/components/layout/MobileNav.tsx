'use client';

import { X, Home, Users, User, Settings, LogOut, PlusCircle, Shield, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import OrganizationSelector from '@/components/organizations/OrganizationSelector';
import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm';
import { useState } from 'react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function MobileNav({ isOpen, onClose, className }: MobileNavProps) {
  const { signOut } = useAuth();
  const { hasPermission } = useOrganizations();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  
  return (
    <nav className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="text-xl">🏆</div>
          <span className="font-bold text-lg">Weekly Wins</span>
        </Link>
        <button
          onClick={onClose}
          className="p-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Organization Selector */}
      <div className="p-4 border-b border-border">
        <OrganizationSelector onCreateNew={() => setShowCreateOrg(true)} />
      </div>
      
      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="mobile-nav-item"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        
        {/* Admin Link - Only show for organization admins */}
        {hasPermission('manage') && (
          <Link
            href="/admin/requests"
            onClick={onClose}
            className="mobile-nav-item"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <button onClick={signOut} className="mobile-nav-item w-full">
          <LogOut className="w-5 h-5" />
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
    </nav>
  );
}