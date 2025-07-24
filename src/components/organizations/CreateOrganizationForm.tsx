'use client';

import { useState } from 'react';
import { X, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { generateSlug, validateSlug } from '@/lib/organizations/utils';

interface CreateOrganizationFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateOrganizationForm({ onClose, onSuccess }: CreateOrganizationFormProps) {
  const { createOrganization } = useOrganizations();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    
    // Clear name error
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));
    
    // Clear slug error
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!validateSlug(formData.slug)) {
      newErrors.slug = 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await createOrganization(
        formData.name.trim(),
        formData.slug.trim(),
        formData.description.trim() || undefined
      );
      
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ general: error.message });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Create Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{errors.general}</span>
            </div>
          )}

          <div className="weekly-form__field">
            <label className="weekly-form__label">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`weekly-form__input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter organization name"
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="weekly-form__field">
            <label className="weekly-form__label">
              URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">weekly-wins.com/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={`weekly-form__input flex-1 ${errors.slug ? 'input-error' : ''}`}
                placeholder="organization-slug"
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>
            {errors.slug && (
              <span className="error-message">{errors.slug}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div className="weekly-form__field">
            <label className="weekly-form__label">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="weekly-form__textarea resize-none h-20"
              placeholder="Brief description of your organization (optional)"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}