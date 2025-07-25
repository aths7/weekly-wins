'use client';

import { useState } from 'react';
import { WeeklyEntry } from '@/lib/supabase/database.types';
import { formatDate, getInitials } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EntryCardProps {
  entry: WeeklyEntry;
  viewMode?: 'grid' | 'list';
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

function ExpandableText({ text, maxLength = 150, className = '' }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...' 
    : text;

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div>
      <p className={className}>{displayText}</p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary hover:text-primary/80 text-xs font-medium mt-1 flex items-center gap-1 transition-colors"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp className="w-3 h-3" />
          </>
        ) : (
          <>
            Show more <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>
    </div>
  );
}

export default function EntryCard({ entry, viewMode = 'grid' }: EntryCardProps) {
  const userInitials = entry.profiles?.full_name ? getInitials(entry.profiles.full_name) : 'U';
  const userName = entry.profiles?.full_name || 'Unknown User';
  const wins = Array.isArray(entry.wins) ? entry.wins as string[] : [];

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
        <div className="status-published">
          <span className="text-xs">✓</span> Published
        </div>
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
            <div className="entry-card__section-content">
              <ExpandableText 
                text={entry.work_summary} 
                className="text-sm"
              />
            </div>
          </div>
        )}
        
        {entry.results_contributed && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              🥅 <span>Results</span>
            </h3>
            <div className="entry-card__section-content">
              <ExpandableText 
                text={entry.results_contributed} 
                className="text-sm"
              />
            </div>
          </div>
        )}
        
        {entry.learnings && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              🎓 <span>Learnings</span>
            </h3>
            <div className="entry-card__section-content">
              <ExpandableText 
                text={entry.learnings} 
                className="text-sm"
              />
            </div>
          </div>
        )}
        
        {entry.challenges && (
          <div className="entry-card__section">
            <h3 className="entry-card__section-title">
              ⚔ <span>Challenges</span>
            </h3>
            <div className="entry-card__section-content">
              <ExpandableText 
                text={entry.challenges} 
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}