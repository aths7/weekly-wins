'use client';

import { useState, useEffect } from 'react';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  // Close mobile nav when switching to desktop
  useEffect(() => {
    if (!isMobile && !isTablet) {
      setIsMobileNavOpen(false);
    }
  }, [isMobile, isTablet]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <Header 
        onMenuClick={() => setIsMobileNavOpen(true)}
        className="lg:hidden"
      />
      
      {/* Mobile Navigation Drawer */}
      <MobileNav 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        className="lg:hidden"
      />
      
      {/* Desktop Layout */}
      <div className="lg:flex lg:h-screen">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:block" />
        
        {/* Main Content */}
        <main className="flex-1 lg:overflow-y-auto">
          {/* Desktop Header */}
          <Header 
            className="hidden lg:block"
            showMenuButton={false}
          />
          
          {/* Page Content */}
          <div className="container-safe py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile nav overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
    </div>
  );
}