'use client';

import { useState } from 'react';
import { ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';

interface OrganizationSelectorProps {
  onCreateNew?: () => void;
}

export default function OrganizationSelector({ onCreateNew }: OrganizationSelectorProps) {
  const { organizations, currentOrganization, switchOrganization, loading } = useOrganizations();
  const [isOpen, setIsOpen] = useState(false);

  const handleOrganizationSwitch = async (organizationId: string) => {
    await switchOrganization(organizationId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md animate-pulse">
        <div className="w-4 h-4 bg-muted-foreground/20 rounded"></div>
        <div className="w-24 h-4 bg-muted-foreground/20 rounded"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Organization
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors bg-background border border-border rounded-md min-w-[200px]"
      >
        <Building2 className="w-4 h-4" />
        <span className="truncate">
          {currentOrganization?.name || 'Select Organization'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSwitch(org.id)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span className="truncate">{org.name}</span>
                {currentOrganization?.id === org.id && (
                  <Check className="w-4 h-4 text-primary ml-auto" />
                )}
              </button>
            ))}
            
            {onCreateNew && (
              <>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-primary"
                >
                  <Plus className="w-4 h-4" />
                  Create New Organization
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}