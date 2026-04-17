import React from 'react';
import { cn } from '../lib/utils';

interface StreamingAppsProps {
  selectedApps: string[];
  onChange: (apps: string[]) => void;
}

const APPS = [
  { id: 'Netflix', name: 'Netflix', color: 'hover:border-[#E50914]' },
  { id: 'Stremio', name: 'Stremio', color: 'hover:border-[#833AB4]' },
  { id: 'Apple TV+', name: 'Apple TV+', color: 'hover:border-white' },
  { id: 'Disney+', name: 'Disney+', color: 'hover:border-[#0063E5]' },
  { id: 'Prime Video', name: 'Prime Video', color: 'hover:border-[#00A8E1]' },
  { id: 'HBO Max', name: 'HBO Max', color: 'hover:border-[#4200FF]' },
];

export function StreamingApps({ selectedApps, onChange }: StreamingAppsProps) {
  const toggleApp = (id: string) => {
    if (selectedApps.includes(id)) {
      onChange(selectedApps.filter(a => a !== id));
    } else {
      onChange([...selectedApps, id]);
    }
  };

  const selectAll = () => {
    if (selectedApps.length === APPS.length) {
      onChange([]);
    } else {
      onChange(APPS.map(a => a.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => toggleApp(app.id)}
            className={cn(
              "h-9 rounded-[4px] border border-brand-border-light bg-brand-surface flex items-center justify-center font-bold text-[10px] uppercase transition-all cursor-pointer",
              selectedApps.includes(app.id) 
                ? "border-brand-accent bg-[#2A1416] text-white" 
                : "text-[#666] hover:text-white"
            )}
          >
            {app.name}
          </button>
        ))}
      </div>
      <button 
        onClick={selectAll}
        className="text-[9px] uppercase tracking-widest text-[#444] hover:text-[#666] transition-colors cursor-pointer"
      >
        {selectedApps.length === APPS.length ? 'Deselect All' : 'Select All Platforms'}
      </button>
    </div>
  );
}
