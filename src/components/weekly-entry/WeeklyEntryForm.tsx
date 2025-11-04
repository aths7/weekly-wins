'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { supabase } from '@/lib/supabase/client';
import { getNextFriday } from '@/lib/utils';
import { ChevronDown, ChevronUp, Save, Send, Loader2, Delete } from 'lucide-react';

interface WeeklyEntryFormData {
  wins: string[];
  workSummary: string;
  resultsContributed: string;
  learnings: string;
  challenges: string;
  weekEndingDate: string;
  isPublished: boolean;
  id?: string;
}

interface WeeklyEntryData {
  user_id: string;
  week_ending_date: string;
  wins: string[];
  work_summary: string;
  results_contributed: string;
  learnings: string;
  challenges: string;
  is_published: boolean;
  organization_id?: string;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getNextFriday());

  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const { currentOrganization } = useOrganizations();
  const router = useRouter();

  // Load from localStorage on mount (immediate restore)
  useEffect(() => {
    const savedData = localStorage.getItem('weeklyEntryDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setSelectedWeek(parsed.weekEndingDate);
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('weeklyEntryDraft', JSON.stringify(formData));
  }, [formData]);

  // Load existing entry from database when user or selectedWeek changes
  useEffect(() => {
    if (user && selectedWeek) {
      loadExistingEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedWeek, currentOrganization?.id]);

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

    setInitialLoading(true);
    try {
      // Build query with organization context
      let query = supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_ending_date', selectedWeek);

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
        // Load existing data from database
        const loadedData = {
          wins: Array.isArray(data.wins) ? data.wins : ['', '', ''],
          workSummary: data.work_summary || '',
          resultsContributed: data.results_contributed || '',
          learnings: data.learnings || '',
          challenges: data.challenges || '',
          weekEndingDate: data.week_ending_date,
          isPublished: data.is_published,
          id: data.id
        };
        setFormData(loadedData);
        localStorage.setItem('weeklyEntryDraft', JSON.stringify(loadedData));
      } else {
        // Only reset if no localStorage data exists
        const savedData = localStorage.getItem('weeklyEntryDraft');
        if (!savedData || JSON.parse(savedData).weekEndingDate !== selectedWeek) {
          const emptyData = {
            wins: ['', '', ''],
            workSummary: '',
            resultsContributed: '',
            learnings: '',
            challenges: '',
            weekEndingDate: selectedWeek,
            isPublished: false,
          };
          setFormData(emptyData);
          localStorage.setItem('weeklyEntryDraft', JSON.stringify(emptyData));
        }
      }
    } catch (error) {
      console.error('Error loading existing entry:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const autoSave = async () => {
    if (!user || autoSaving || initialLoading) return;

    const hasContent = formData.wins.some(win => win.trim()) ||
      formData.workSummary.trim() ||
      formData.resultsContributed.trim() ||
      formData.learnings.trim() ||
      formData.challenges.trim();

    if (!hasContent) return;

    setAutoSaving(true);
    try {
      const entryData: Partial<WeeklyEntryData> & { id?: string } = {
        user_id: user.id,
        week_ending_date: formData.weekEndingDate,
        wins: formData.wins,
        work_summary: formData.workSummary,
        results_contributed: formData.resultsContributed,
        learnings: formData.learnings,
        challenges: formData.challenges,
        is_published: false,
      };

      // Add organization_id if available
      if (currentOrganization) {
        entryData.organization_id = currentOrganization.id;
      }

      // Use update if we have an ID, otherwise insert
      if (formData.id) {
        const { error } = await supabase
          .from('weekly_entries')
          .update(entryData)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('weekly_entries')
          .insert([entryData])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setFormData(prev => ({ ...prev, id: data.id }));
        }
      }
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoSaving, initialLoading]);

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const entryData: Partial<WeeklyEntryData> & { id?: string } = {
        user_id: user.id,
        week_ending_date: formData.weekEndingDate,
        wins: formData.wins,
        work_summary: formData.workSummary,
        results_contributed: formData.resultsContributed,
        learnings: formData.learnings,
        challenges: formData.challenges,
        is_published: publish,
      };

      // Add organization_id if available
      if (currentOrganization) {
        entryData.organization_id = currentOrganization.id;
      }

      // Use update if we have an ID, otherwise insert
      if (formData.id) {
        const { error } = await supabase
          .from('weekly_entries')
          .update(entryData)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('weekly_entries')
          .insert([entryData]);
        if (error) throw error;
      }

      setSuccess(publish ? 'Entry published successfully!' : 'Draft saved successfully!');

      // Clear localStorage draft after successful save
      localStorage.removeItem('weeklyEntryDraft');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('weekly_entries')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;

      setSuccess("Entry deleted successfully!");
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
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              setFormData(prev => ({ ...prev, weekEndingDate: e.target.value }));
            }}
            className="weekly-form__input max-w-xs"
          />
        </div>
      </div>

      {/* Loading State */}
      {initialLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading entry...</span>
          </div>
        </div>
      )}

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
      {!initialLoading && formData.isPublished === false && (
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
      {!initialLoading && (
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
      )}

      {/* Action Buttons */}
      {!initialLoading && (
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
              onClick={() => handleDelete()}
              disabled={loading}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <Delete className="w-4 h-4 mr-2" />
              Delete Draft
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
      )}
    </div>
  );
}