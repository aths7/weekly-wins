'use client';

import { useState, useEffect } from 'react';
import { Save, X, Settings, Palette, Shield, Bell } from 'lucide-react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { getDefaultOrganizationSettings, getDayName } from '@/lib/organizations/utils';
import { Organization, OrganizationSettings as OrgSettings } from '@/lib/supabase/database.types';

interface OrganizationSettingsProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function OrganizationSettings({ onClose, onSuccess }: OrganizationSettingsProps) {
  const { currentOrganization, updateOrganization } = useOrganizations();
  const [formData, setFormData] = useState<Partial<Organization>>({});
  const [settings, setSettings] = useState<OrgSettings>(getDefaultOrganizationSettings());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'workflow' | 'notifications'>('general');

  useEffect(() => {
    if (currentOrganization) {
      setFormData({
        name: currentOrganization.name,
        description: currentOrganization.description,
        primary_color: currentOrganization.primary_color,
        secondary_color: currentOrganization.secondary_color,
      });
      
      if (currentOrganization.settings) {
        setSettings({
          ...getDefaultOrganizationSettings(),
          ...(currentOrganization.settings as OrgSettings),
        });
      }
    }
  }, [currentOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization) return;

    setIsSubmitting(true);
    
    try {
      await updateOrganization(currentOrganization.id, {
        ...formData,
        settings,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSettings = (key: keyof OrgSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!currentOrganization) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Organization Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-muted/50 border-r border-border">
            <nav className="p-4 space-y-2">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'branding', label: 'Branding', icon: Palette },
                { id: 'workflow', label: 'Workflow', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  
                  <div className="weekly-form__field">
                    <label className="weekly-form__label">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="weekly-form__input"
                      placeholder="Enter organization name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="weekly-form__field">
                    <label className="weekly-form__label">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="weekly-form__textarea h-24"
                      placeholder="Brief description of your organization"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Branding</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="weekly-form__field">
                      <label className="weekly-form__label">
                        Primary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primary_color || '#3b82f6'}
                          onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-12 h-12 rounded border border-border"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={formData.primary_color || '#3b82f6'}
                          onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="weekly-form__input flex-1"
                          placeholder="#3b82f6"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="weekly-form__field">
                      <label className="weekly-form__label">
                        Secondary Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color || '#10b981'}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-12 h-12 rounded border border-border"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={formData.secondary_color || '#10b981'}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="weekly-form__input flex-1"
                          placeholder="#10b981"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="flex gap-2">
                      <div 
                        className="w-16 h-8 rounded"
                        style={{ backgroundColor: formData.primary_color || '#3b82f6' }}
                      />
                      <div 
                        className="w-16 h-8 rounded"
                        style={{ backgroundColor: formData.secondary_color || '#10b981' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Workflow Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Require Entry Approval</p>
                        <p className="text-sm text-muted-foreground">
                          All weekly entries must be approved by an admin before being published
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.require_approval}
                          onChange={(e) => updateSettings('require_approval', e.target.checked)}
                          className="sr-only peer"
                          disabled={isSubmitting}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Auto-approve New Members</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve entries from new members
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.auto_approve_members}
                          onChange={(e) => updateSettings('auto_approve_members', e.target.checked)}
                          className="sr-only peer"
                          disabled={isSubmitting}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Allow Public View</p>
                        <p className="text-sm text-muted-foreground">
                          Allow non-members to view published entries
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allow_public_view}
                          onChange={(e) => updateSettings('allow_public_view', e.target.checked)}
                          className="sr-only peer"
                          disabled={isSubmitting}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Weekly Reminders</p>
                        <p className="text-sm text-muted-foreground">
                          Send email reminders to submit weekly entries
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.weekly_reminder_enabled}
                          onChange={(e) => updateSettings('weekly_reminder_enabled', e.target.checked)}
                          className="sr-only peer"
                          disabled={isSubmitting}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.weekly_reminder_enabled && (
                      <div className="weekly-form__field">
                        <label className="weekly-form__label">
                          Reminder Day
                        </label>
                        <select
                          value={settings.weekly_reminder_day}
                          onChange={(e) => updateSettings('weekly_reminder_day', parseInt(e.target.value))}
                          className="weekly-form__input"
                          disabled={isSubmitting}
                        >
                          {[0, 1, 2, 3, 4, 5, 6].map(day => (
                            <option key={day} value={day}>
                              {getDayName(day)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Members will receive reminders on this day to submit their weekly entries
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-border">
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
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}