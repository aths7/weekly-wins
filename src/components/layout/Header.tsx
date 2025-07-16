'use client';

import { Menu, Search, Bell, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  className?: string;
}

export default function Header({ 
  onMenuClick, 
  showMenuButton = true,
  className 
}: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border",
      "px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-18",
      className
    )}>
      <div className="flex items-center justify-between h-full">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl">🏆</div>
            <span className="font-bold text-lg sm:text-xl text-foreground">
              Weekly Wins
            </span>
          </Link>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search - hidden on mobile */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search...</span>
          </button>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <button className="p-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          {/* User Menu */}
          <button className="p-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}