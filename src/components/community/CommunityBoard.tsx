'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { useOrganizations, useOrganizationMembers } from '@/lib/hooks/useOrganizations';
import { supabase } from '@/lib/supabase/client';
import { WeeklyEntry } from '@/lib/supabase/database.types';
import { Search, Filter, Grid, List, Building2, X } from 'lucide-react';
import EntryCard from './EntryCard';

// Helper function to get week options (Saturday to Friday)
const getWeekOptions = () => {
  const options = [];
  const today = new Date();

  // Calculate days since Saturday (0 = Sunday, 6 = Saturday)
  const dayOfWeek = today.getDay();
  const daysSinceSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

  // Get last 12 weeks
  for (let i = 0; i < 12; i++) {
    // Week ends on Friday
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - daysSinceSaturday - 1 - (7 * i));

    // Week starts on Saturday (6 days before Friday)
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const formatDate = (d: Date) => {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    const label = i === 0
      ? `This Week (${formatDate(weekStart)} - ${formatDate(weekEnd)})`
      : i === 1
      ? `Last Week (${formatDate(weekStart)} - ${formatDate(weekEnd)})`
      : `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

    options.push({
      value: weekEnd.toISOString().split('T')[0],
      label,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    });
  }

  return options;
};

export default function CommunityBoard() {
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [weekFilter, setWeekFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { isMobile } = useBreakpoint();
  const { currentOrganization } = useOrganizations();
  const { members } = useOrganizationMembers(currentOrganization?.id || '');

  const weekOptions = useMemo(() => getWeekOptions(), []);

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

      // Try to filter by organization
      try {
        if (currentOrganization) {
          query = query.eq('organization_id', currentOrganization.id);
        } else {
          query = query.is('organization_id', null);
        }
      } catch (orgFilterError) {
        console.warn('Organization filtering not available:', orgFilterError);
      }

      // Apply week filter
      if (weekFilter !== 'all') {
        const selectedWeek = weekOptions.find(w => w.value === weekFilter);
        if (selectedWeek) {
          query = query
            .gte('week_ending_date', selectedWeek.weekStart)
            .lte('week_ending_date', selectedWeek.weekEnd);
        }
      }

      // Apply member filter
      if (memberFilter !== 'all') {
        query = query.eq('user_id', memberFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newEntries = reset ? data || [] : [...entries, ...(data || [])];
      setEntries(newEntries);
      setHasMore((data || []).length === 10);
    } catch (error) {
      console.error('Error fetching entries:', error);
      // If it's a database column error, try without organization filtering
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as { code: string }).code === '42703') {
          console.warn('Organization column not found, retrying without organization filter...');
          try {
            let retryQuery = supabase
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

            // Apply week filter for retry
            if (weekFilter !== 'all') {
              const selectedWeek = weekOptions.find(w => w.value === weekFilter);
              if (selectedWeek) {
                retryQuery = retryQuery
                  .gte('week_ending_date', selectedWeek.weekStart)
                  .lte('week_ending_date', selectedWeek.weekEnd);
              }
            }

            // Apply member filter for retry
            if (memberFilter !== 'all') {
              retryQuery = retryQuery.eq('user_id', memberFilter);
            }

            const { data: retryData, error: retryError } = await retryQuery;

            if (retryError) throw retryError;

            const entriesWithProfiles = (retryData || []).map(entry => ({
              ...entry,
              profiles: entry.profiles
            }));

            if (reset || pageNum === 1) {
              setEntries(entriesWithProfiles);
            } else {
              setEntries(prev => [...prev, ...entriesWithProfiles]);
            }

            setHasMore((retryData || []).length === 10);
            return;
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter persistence
  useEffect(() => {
    const savedFilters = sessionStorage.getItem('communityFilters');
    if (savedFilters) {
      try {
        const { weekFilter: savedWeek, memberFilter: savedMember, searchTerm: savedSearch } = JSON.parse(savedFilters);
        if (savedWeek) setWeekFilter(savedWeek);
        if (savedMember) setMemberFilter(savedMember);
        if (savedSearch) setSearchTerm(savedSearch);
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('communityFilters', JSON.stringify({ weekFilter, memberFilter, searchTerm }));
  }, [weekFilter, memberFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
    fetchEntries(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekFilter, memberFilter, currentOrganization]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, false);
  };

  const clearAllFilters = () => {
    setWeekFilter('all');
    setMemberFilter('all');
    setSearchTerm('');
  };

  const removeFilter = (filterType: 'week' | 'member' | 'search') => {
    if (filterType === 'week') setWeekFilter('all');
    if (filterType === 'member') setMemberFilter('all');
    if (filterType === 'search') setSearchTerm('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (weekFilter !== 'all') count++;
    if (memberFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [weekFilter, memberFilter, searchTerm]);

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
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Community Board
              </h1>
              {currentOrganization && (
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {currentOrganization.name}
                  </span>
                </div>
              )}
            </div>
            
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const thisWeekValue = weekOptions[0]?.value;
                  if (weekFilter === thisWeekValue) {
                    setWeekFilter('all');
                  } else {
                    setWeekFilter(thisWeekValue);
                  }
                }}
                className={`${
                  weekFilter === weekOptions[0]?.value
                    ? 'btn-primary'
                    : 'btn-outline'
                } flex items-center gap-2 whitespace-nowrap`}
              >
                <span>This Week</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center gap-2 relative"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Collapsible filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Week</label>
                  <select
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                    className="weekly-form__input"
                  >
                    <option value="all">All Weeks</option>
                    {weekOptions.map(week => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Team Member</label>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="weekly-form__input"
                  >
                    <option value="all">All Members</option>
                    {members.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active filter indicators */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                  <button
                    onClick={() => removeFilter('search')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {weekFilter !== 'all' && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  <span>Week: {weekOptions.find(w => w.value === weekFilter)?.label}</span>
                  <button
                    onClick={() => removeFilter('week')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {memberFilter !== 'all' && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                  <span>Member: {members.find(m => m.user_id === memberFilter)?.full_name || 'Unknown'}</span>
                  <button
                    onClick={() => removeFilter('member')}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Entry grid/list */}
      <div className="container-safe py-6">
        {/* Results counter */}
        {!loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            {activeFiltersCount > 0 ? (
              <span>
                Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                {weekFilter !== 'all' && ` for ${weekOptions.find(w => w.value === weekFilter)?.label}`}
                {memberFilter !== 'all' && ` by ${members.find(m => m.user_id === memberFilter)?.full_name || 'member'}`}
                {searchTerm && ` matching \u201C${searchTerm}\u201D`}
              </span>
            ) : (
              <span>Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}</span>
            )}
          </div>
        )}

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