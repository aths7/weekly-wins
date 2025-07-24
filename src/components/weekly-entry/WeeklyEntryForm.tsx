'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { supabase } from '@/lib/supabase/client';
import { getNextFriday } from '@/lib/utils';
import { ChevronDown, ChevronUp, Save, Send, Loader2, Clock, CheckCircle } from 'lucide-react';

interface WeeklyEntryFormData {
  wins: string[];
  workSummary: string;
  resultsContributed: string;
  learnings: string;
  challenges: string;
  weekEndingDate: string;
  isPublished: boolean;
}

export default function WeeklyEntryForm() {
  const [formData, setFormData] = useState<WeeklyEntryFormData>({
    wins: ['', '', ''],
    workSummary: '',
    resultsContributed: '',
    learnings: '',
    challenges: '',
    weekEndingDate: getNextFriday(),
    isPublished: false,
  });
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['wins']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const { currentOrganization } = useOrganizations();
  const router = useRouter();

  // Load existing draft when component mounts
  useEffect(() => {
    if (user) {
      loadExistingEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload entry when week ending date changes
  useEffect(() => {
    if (user && formData.weekEndingDate) {
      loadExistingEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.weekEndingDate, user]);

  const toggleSection = (section: string) => {
    if (isMobile) {
      setExpandedSections(prev => 
        prev.includes(section) 
          ? prev.filter(s => s !== section)
          : [...prev, section]
      );
    }
  };

  const updateWin = (index: number, value: string) => {
    const newWins = [...formData.wins];
    newWins[index] = value;
    setFormData(prev => ({ ...prev, wins: newWins }));
  };

  const updateField = (field: keyof WeeklyEntryFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadExistingEntry = async () => {
    if (!user) return;

    try {
      // Build query with organization context
      let query = supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_ending_date', formData.weekEndingDate);

      // Add organization filter if user is in an organization (with error handling)
      try {
        if (currentOrganization) {
          query = query.eq('organization_id', currentOrganization.id);
        } else {
          query = query.is('organization_id', null);
        }
      } catch (orgError) {
        console.warn('Organization filtering not available in loadExistingEntry:', orgError);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new entries
        throw error;
      }

      if (data) {
        // Load existing data
        setFormData({
          wins: Array.isArray(data.wins) ? data.wins : ['', '', ''],
          workSummary: data.work_summary || '',
          resultsContributed: data.results_contributed || '',
          learnings: data.learnings || '',
          challenges: data.challenges || '',
          weekEndingDate: data.week_ending_date,
          isPublished: data.is_published,
        });
      }
    } catch (error) {
      console.error('Error loading existing entry:', error);
    }
  };

  const autoSave = async () => {
    if (!user || autoSaving) return;
    
    const hasContent = formData.wins.some(win => win.trim()) || 
                      formData.workSummary.trim() || 
                      formData.resultsContributed.trim() || 
                      formData.learnings.trim() || 
                      formData.challenges.trim();
    
    if (!hasContent) return;

    setAutoSaving(true);
    try {
      const entryData: any = {
        user_id: user.id,
        week_ending_date: formData.weekEndingDate,
        wins: formData.wins,
        work_summary: formData.workSummary,
        results_contributed: formData.resultsContributed,
        learnings: formData.learnings,
        challenges: formData.challenges,
        is_published: false,
      };

      // Try to add organization_id if available
      try {
        if (currentOrganization) {
          entryData.organization_id = currentOrganization.id;
        } else {
          entryData.organization_id = null;
        }
      } catch (orgError) {
        console.warn('Organization ID not supported in auto-save:', orgError);
      }

      const { error } = await supabase
        .from('weekly_entries')
        .upsert(entryData, {
          onConflict: 'user_id,week_ending_date'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, user, autoSaving]);

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const entryData: any = {
        user_id: user.id,
        week_ending_date: formData.weekEndingDate,
        wins: formData.wins,
        work_summary: formData.workSummary,
        results_contributed: formData.resultsContributed,
        learnings: formData.learnings,
        challenges: formData.challenges,
        is_published: publish,
      };

      // Try to add organization_id if available
      try {
        if (currentOrganization) {
          entryData.organization_id = currentOrganization.id;
        } else {
          entryData.organization_id = null;
        }
      } catch (orgError) {
        console.warn('Organization ID not supported in submit:', orgError);
      }

      const { error } = await supabase
        .from('weekly_entries')
        .upsert(entryData, {
          onConflict: 'user_id,week_ending_date'
        });

      if (error) throw error;

      setSuccess(publish ? 'Entry published successfully!' : 'Draft saved successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 'wins',
      icon: '🏆',
      title: '3 Wins of the Week',
      subtitle: 'No matter how small - celebrate your achievements!',
      component: (
        <div className="space-y-4">
          {formData.wins.map((win, index) => (
            <div key={index} className="weekly-form__field">
              <label className="weekly-form__label">
                <span className="text-primary font-medium">Win #{index + 1}</span>
              </label>
              <input
                type="text"
                value={win}
                onChange={(e) => updateWin(index, e.target.value)}
                className="weekly-form__input"
                placeholder={`Describe win #${index + 1}...`}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'work',
      icon: '📝',
      title: 'What did you work on?',
      component: (
        <textarea
          value={formData.workSummary}
          onChange={(e) => updateField('workSummary', e.target.value)}
          className="weekly-form__textarea"
          placeholder="Share what you focused on this week..."
          rows={4}
        />
      ),
    },
    {
      id: 'results',
      icon: '🥅',
      title: 'What result did you contribute to?',
      component: (
        <textarea
          value={formData.resultsContributed}
          onChange={(e) => updateField('resultsContributed', e.target.value)}
          className="weekly-form__textarea"
          placeholder="Describe the impact or outcome of your work..."
          rows={4}
        />
      ),
    },
    {
      id: 'learning',
      icon: '🎓',
      title: 'What did you learn?',
      component: (
        <textarea
          value={formData.learnings}
          onChange={(e) => updateField('learnings', e.target.value)}
          className="weekly-form__textarea"
          placeholder="Share new skills, insights, or knowledge gained..."
          rows={4}
        />
      ),
    },
    {
      id: 'challenges',
      icon: '⚔',
      title: 'What challenges are you facing?',
      component: (
        <textarea
          value={formData.challenges}
          onChange={(e) => updateField('challenges', e.target.value)}
          className="weekly-form__textarea"
          placeholder="Describe any obstacles or difficulties you're working through..."
          rows={4}
        />
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Weekly Entry</h1>
        <p className="text-muted-foreground">
          Reflect on your week and share your progress
        </p>
      </div>

      {/* Week Selection */}
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        <div className="weekly-form__field">
          <label className="weekly-form__label">
            📅 Week ending date
          </label>
          <input
            type="date"
            value={formData.weekEndingDate}
            onChange={(e) => updateField('weekEndingDate', e.target.value)}
            className="weekly-form__input max-w-xs"
          />
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-success/10 text-success border border-success/20 rounded-md p-3">
          {success}
        </div>
      )}

      {/* Draft Indicator */}
      {formData.isPublished === false && (
        formData.wins.some(win => win.trim()) || 
        formData.workSummary.trim() || 
        formData.resultsContributed.trim() || 
        formData.learnings.trim() || 
        formData.challenges.trim()
      ) && (
        <div className="bg-info/10 text-info border border-info/20 rounded-md p-3">
          📝 Draft loaded - you can continue editing your entry for the week ending {formData.weekEndingDate}
        </div>
      )}

      {/* Form Sections */}
      <div className="weekly-form">
        {sections.map((section) => {
          const isExpanded = !isMobile || expandedSections.includes(section.id);
          
          return (
            <div key={section.id} className="weekly-form__section">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full ${isMobile ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!isMobile}
              >
                <div className="weekly-form__header">
                  <span className="text-xl sm:text-2xl">{section.icon}</span>
                  <div className="flex-1 text-left">
                    <h2 className="text-responsive-lg font-semibold">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  {isMobile && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="mt-4">
                  {section.component}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="flex-1 text-center sm:text-left">
            {autoSaving && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Auto-saving...
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish Entry
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}