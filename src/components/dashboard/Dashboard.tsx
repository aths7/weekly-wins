'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { supabase } from '@/lib/supabase/client';
import { WeeklyEntry } from '@/lib/supabase/database.types';
import { getNextFriday, formatDate } from '@/lib/utils';
import { PlusCircle, Edit3, Calendar, Award, TrendingUp, Building2, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentOrganization, getCurrentMembership, hasPermission } = useOrganizations();
  const [stats, setStats] = useState({
    totalEntries: 0,
    publishedEntries: 0,
    currentStreak: 0,
    draftsCount: 0,
  });
  const [currentWeekEntry, setCurrentWeekEntry] = useState<WeeklyEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const userMembership = getCurrentMembership();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch all user entries
      const { data: entries, error } = await supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_ending_date', { ascending: false });

      if (error) throw error;

      const allEntries = entries || [];
      const publishedEntries = allEntries.filter(e => e.is_published);
      const drafts = allEntries.filter(e => !e.is_published);

      // Check for current week entry
      const currentWeekEndingDate = getNextFriday();
      const currentWeek = allEntries.find(e => e.week_ending_date === currentWeekEndingDate);

      setStats({
        totalEntries: allEntries.length,
        publishedEntries: publishedEntries.length,
        currentStreak: calculateCurrentStreak(publishedEntries),
        draftsCount: drafts.length,
      });

      setCurrentWeekEntry(currentWeek || null);
      setRecentEntries(allEntries.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Handle RLS recursion errors gracefully
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === '42P17') {
        console.error('RLS policy recursion detected in dashboard. Organization features may not work properly.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = (entries: WeeklyEntry[]) => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.week_ending_date).getTime() - new Date(a.week_ending_date).getTime()
    );
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          {currentOrganization && (
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {currentOrganization.name}
              </span>
              {userMembership && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    {userMembership.role === 'super_admin' && <Shield className="w-3 h-3 text-red-500" />}
                    {userMembership.role === 'org_admin' && <Shield className="w-3 h-3 text-blue-500" />}
                    {userMembership.role === 'member' && <Users className="w-3 h-3 text-green-500" />}
                    <span className="text-xs text-muted-foreground capitalize">
                      {userMembership.role.replace('_', ' ')}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome back!
        </div>
      </div>

      {/* Current Week Status */}
      <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">This Week</h2>
          <div className="text-sm text-muted-foreground">
            Week ending {formatDate(getNextFriday())}
          </div>
        </div>
        
        {currentWeekEntry ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {currentWeekEntry.is_published ? '🏆' : '📝'}
              </div>
              <div>
                <p className="font-medium">
                  {currentWeekEntry.is_published ? 'Entry Published' : 'Draft Saved'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentWeekEntry.is_published ? 'Great job this week!' : 'Continue working on your entry'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/submit" className="btn-outline">
              <Edit3 className="w-4 h-4 mr-2" />
              {currentWeekEntry.is_published ? 'Edit' : 'Continue'}
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💭</div>
              <div>
                <p className="font-medium">No entry yet</p>
                <p className="text-sm text-muted-foreground">
                  Start reflecting on your week
                </p>
              </div>
            </div>
            <Link href="/dashboard/submit" className="btn-primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Entry
            </Link>
          </div>
        )}
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Total Entries</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.totalEntries}</p>
          <p className="text-sm text-muted-foreground">All time</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-success" />
            <h3 className="font-semibold">Published</h3>
          </div>
          <p className="text-2xl font-bold text-success">{stats.publishedEntries}</p>
          <p className="text-sm text-muted-foreground">Public entries</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-info" />
            <h3 className="font-semibold">Current Streak</h3>
          </div>
          <p className="text-2xl font-bold text-info">{stats.currentStreak}</p>
          <p className="text-sm text-muted-foreground">Weeks in a row</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Edit3 className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Drafts</h3>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.draftsCount}</p>
          <p className="text-sm text-muted-foreground">Unpublished</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        
        {recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your weekly reflection journey!
            </p>
            <Link href="/dashboard/submit" className="btn-primary">
              Create First Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {entry.is_published ? '🏆' : '📝'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.is_published ? 'Published entry' : 'Draft saved'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Week ending {formatDate(entry.week_ending_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!entry.is_published && (
                    <div className="status-draft">Draft</div>
                  )}
                  <Link 
                    href="/dashboard/submit" 
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    {entry.is_published ? 'View' : 'Edit'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}