'use client';

import { WeeklyEntry } from '@/lib/supabase/database.types';
import { formatDate, getInitials } from '@/lib/utils';

interface EntryCardProps {
  entry: WeeklyEntry;
  viewMode?: 'grid' | 'list';
}

export default function EntryCard({ entry, viewMode = 'grid' }: EntryCardProps) {
  const userInitials = entry.profiles?.full_name ? getInitials(entry.profiles.full_name) : 'U';
  const userName = entry.profiles?.full_name || 'Unknown User';
  const wins = Array.isArray(entry.wins) ? entry.wins : [];

  return (
    <div className={`entry-card ${viewMode === 'list' ? 'lg:flex lg:gap-6' : ''}`}>
      <div className="entry-card__header">
        <div className="entry-card__user">
          <div className="entry-card__avatar">
            {userInitials}
          </div>
          <div className="entry-card__user-info">
            <p className="entry-card__username">{userName}</p>
            <p className="entry-card__date">
              Week ending {formatDate(entry.week_ending_date)}
            </p>
          </div>
        </div>
        <div className="status-published">Published</div>
      </div>
      
      <div className="entry-card__content">
        {wins.length > 0 && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              🏆 <span>Top Wins</span>
            </h3>
            <ul className="entry-card__section-content space-y-1">
              {wins.map((win, index) => (
                <li key={index} className="text-sm">• {win}</li>
              ))}
            </ul>
          </div>
        )}
        
        {entry.work_summary && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              📝 <span>Focus Areas</span>
            </h3>
            <p className="entry-card__section-content text-sm">
              {entry.work_summary.length > 150 
                ? entry.work_summary.substring(0, 150) + '...' 
                : entry.work_summary}
            </p>
          </div>
        )}
        
        {entry.results_contributed && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              🥅 <span>Results</span>
            </h3>
            <p className="entry-card__section-content text-sm">
              {entry.results_contributed.length > 150 
                ? entry.results_contributed.substring(0, 150) + '...' 
                : entry.results_contributed}
            </p>
          </div>
        )}
        
        {entry.learnings && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              🎓 <span>Learnings</span>
            </h3>
            <p className="entry-card__section-content text-sm">
              {entry.learnings.length > 150 
                ? entry.learnings.substring(0, 150) + '...' 
                : entry.learnings}
            </p>
          </div>
        )}
        
        {entry.challenges && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              ⚔ <span>Challenges</span>
            </h3>
            <p className="entry-card__section-content text-sm">
              {entry.challenges.length > 150 
                ? entry.challenges.substring(0, 150) + '...' 
                : entry.challenges}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}