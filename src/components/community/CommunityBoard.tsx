'use client';

import { useState, useEffect } from 'react';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { supabase } from '@/lib/supabase/client';
import { WeeklyEntry } from '@/lib/supabase/database.types';
import { Search, Filter, Grid, List, Loader2 } from 'lucide-react';
import EntryCard from './EntryCard';

export default function CommunityBoard() {
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { isMobile } = useBreakpoint();

  // Auto-adjust view mode based on screen size
  useEffect(() => {
    if (isMobile) {
      setViewMode('list');
    }
  }, [isMobile]);

  const fetchEntries = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    
    try {
      let query = supabase
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
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 10, pageNum * 10 - 1);

      // Apply date filter
      if (dateFilter === 'this_week') {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        query = query.gte('week_ending_date', weekStart.toISOString().split('T')[0]);
      } else if (dateFilter === 'last_week') {
        const today = new Date();
        const lastWeekEnd = new Date(today.setDate(today.getDate() - today.getDay() - 1));
        const lastWeekStart = new Date(lastWeekEnd.setDate(lastWeekEnd.getDate() - 6));
        query = query
          .gte('week_ending_date', lastWeekStart.toISOString().split('T')[0])
          .lte('week_ending_date', lastWeekEnd.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newEntries = reset ? data || [] : [...entries, ...(data || [])];
      setEntries(newEntries);
      setHasMore((data || []).length === 10);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(1, true);
  }, [dateFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, false);
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const userName = entry.profiles?.full_name?.toLowerCase() || '';
    const workSummary = entry.work_summary?.toLowerCase() || '';
    const wins = Array.isArray(entry.wins) ? entry.wins.join(' ').toLowerCase() : '';
    
    return userName.includes(searchLower) || 
           workSummary.includes(searchLower) || 
           wins.includes(searchLower);
  });

  const EntryCardSkeleton = () => (
    <div className="entry-card">
      <div className="entry-card__header">
        <div className="entry-card__user">
          <div className="entry-card__avatar loading-skeleton"></div>
          <div className="entry-card__user-info space-y-2">
            <div className="h-4 w-24 loading-skeleton"></div>
            <div className="h-3 w-32 loading-skeleton"></div>
          </div>
        </div>
        <div className="h-6 w-16 loading-skeleton rounded-full"></div>
      </div>
      
      <div className="entry-card__content space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-20 loading-skeleton"></div>
          <div className="h-3 w-full loading-skeleton"></div>
          <div className="h-3 w-3/4 loading-skeleton"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 loading-skeleton"></div>
          <div className="h-3 w-full loading-skeleton"></div>
          <div className="h-3 w-2/3 loading-skeleton"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="community-board">
      {/* Header */}
      <div className="sticky top-14 sm:top-16 lg:top-18 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container-safe py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Community Board
            </h1>
            
            {/* Desktop view toggle */}
            {!isMobile && (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-muted border-0 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
          
          {/* Collapsible filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Time Period</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="weekly-form__input"
                  >
                    <option value="all">All Time</option>
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select className="weekly-form__input">
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Entry grid/list */}
      <div className="container-safe py-6">
        <div className={
          viewMode === 'grid' 
            ? 'community-grid' 
            : 'space-y-4'
        }>
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} viewMode={viewMode} />
          ))}
          
          {loading && Array.from({ length: 3 }).map((_, index) => (
            <EntryCardSkeleton key={index} />
          ))}
        </div>
        
        {/* Load more button */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="btn-outline"
            >
              Load More
            </button>
          </div>
        )}
        
        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share your weekly wins!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}