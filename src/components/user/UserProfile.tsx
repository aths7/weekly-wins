'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { WeeklyEntry, Profile } from '@/lib/supabase/database.types';
import { getInitials, formatDate } from '@/lib/utils';
import { Calendar, Target, Award, TrendingUp, Edit2, Mail, User } from 'lucide-react';
import EntryCard from '@/components/community/EntryCard';

export default function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    publishedEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEntries();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weekly_entries')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('week_ending_date', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      
      // Calculate stats
      const totalEntries = data?.length || 0;
      const publishedEntries = data?.filter(entry => entry.is_published).length || 0;
      
      setStats({
        totalEntries,
        publishedEntries,
        currentStreak: calculateCurrentStreak(data || []),
        longestStreak: calculateLongestStreak(data || []),
      });
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = (entries: WeeklyEntry[]) => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries
      .filter(e => e.is_published)
      .sort((a, b) => new Date(b.week_ending_date).getTime() - new Date(a.week_ending_date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.week_ending_date);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (entries: WeeklyEntry[]) => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries
      .filter(e => e.is_published)
      .sort((a, b) => new Date(a.week_ending_date).getTime() - new Date(b.week_ending_date).getTime());
    
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.week_ending_date);
      
      if (lastDate) {
        const daysDiff = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      lastDate = entryDate;
    }
    
    return Math.max(longestStreak, currentStreak);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userInitials = profile?.full_name ? getInitials(profile.full_name) : 'U';

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <div className="user-profile__header">
        <div className="user-profile__avatar">
          {userInitials}
        </div>
        
        <div className="user-profile__info">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="weekly-form__input"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="weekly-form__input"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="btn-primary">
                  Save Changes
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="user-profile__name">
                  {profile?.full_name || 'User'}
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile?.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Member since {formatDate(profile?.created_at || '')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="user-profile__stats">
        <div className="user-profile__stat">
          <div className="user-profile__stat-value">{stats.totalEntries}</div>
          <div className="user-profile__stat-label">Total Entries</div>
        </div>
        
        <div className="user-profile__stat">
          <div className="user-profile__stat-value">{stats.publishedEntries}</div>
          <div className="user-profile__stat-label">Published</div>
        </div>
        
        <div className="user-profile__stat">
          <div className="user-profile__stat-value">{stats.currentStreak}</div>
          <div className="user-profile__stat-label">Current Streak</div>
        </div>
        
        <div className="user-profile__stat">
          <div className="user-profile__stat-value">{stats.longestStreak}</div>
          <div className="user-profile__stat-label">Longest Streak</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Weekly Entries</h2>
          <div className="text-sm text-muted-foreground">
            {entries.length} total entries
          </div>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your weekly progress!
            </p>
            <a href="/dashboard/submit" className="btn-primary">
              Create First Entry
            </a>
          </div>
        ) : (
          <div className="community-grid">
            {entries.map((entry) => (
              <div key={entry.id} className="relative">
                <EntryCard entry={entry} />
                {!entry.is_published && (
                  <div className="absolute top-2 right-2 status-draft">
                    Draft
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}