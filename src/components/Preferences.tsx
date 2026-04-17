import React from 'react';
import { AgeRating, ContentType } from '../types';
import { cn } from '../lib/utils';

interface PreferencesProps {
  ageRating: AgeRating;
  contentType: ContentType;
  onAgeChange: (rating: AgeRating) => void;
  onTypeChange: (type: ContentType) => void;
}

const AGE_RATINGS: AgeRating[] = ['All ages', '13+', '14+', '16+', '18+'];
const CONTENT_TYPES: ContentType[] = ['Movie', 'TV Show', 'Both'];

export function Preferences({ ageRating, contentType, onAgeChange, onTypeChange }: PreferencesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="section-title">Age Rating</span>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map((rating) => (
            <button
              key={rating}
              onClick={() => onAgeChange(rating)}
              className={cn(
                "pill cursor-pointer",
                ageRating === rating && "pill-active"
              )}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="section-title">Content Type</span>
        <div className="grid grid-cols-3 gap-2">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={cn(
                "pill cursor-pointer",
                contentType === type && "pill-active"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
