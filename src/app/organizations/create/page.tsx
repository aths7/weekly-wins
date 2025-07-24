'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Palette, Settings, Save } from 'lucide-react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import Link from 'next/link';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { createOrganization } = useOrganizations();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    require_approval: true,
    auto_approve_members: false,
    allow_public_view: false,
    weekly_reminder_enabled: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Organization slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug if it hasn't been manually edited
      slug: prev.slug === generateSlug(prev.name) || !prev.slug
        ? generateSlug(name)
        : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const orgId = await createOrganization(
        formData.name.trim(),
        formData.slug.trim(),
        formData.description.trim() || undefined
      );

      router.push('/organizations');
    } catch (error) {
      console.error('Failed to create organization:', error);
      setErrors({ submit: 'Failed to create organization. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/organizations"
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Organization</h1>
          <p className="text-muted-foreground">
            Set up your new community for weekly wins sharing
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter organization name"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Organization Slug *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                  @
                </span>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="organization-slug"
                  className="flex-1 px-3 py-2 border border-border rounded-r-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used in URLs and mentions. Only lowercase letters, numbers, and hyphens.
              </p>
              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your organization's purpose and goals..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="primary_color" className="block text-sm font-medium mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primary_color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 border border-border rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="secondary_color" className="block text-sm font-medium mb-2">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-10 border border-border rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="flex items-center gap-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: formData.primary_color }}
              >
                {formData.name.charAt(0).toUpperCase() || 'O'}
              </div>
              <div className="flex gap-2">
                <span
                  className="px-3 py-1 rounded-md text-white text-sm"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  Primary
                </span>
                <span
                  className="px-3 py-1 rounded-md text-white text-sm"
                  style={{ backgroundColor: formData.secondary_color }}
                >
                  Secondary
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/organizations"
            className="flex-1 px-4 py-2 text-center text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Organization
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}