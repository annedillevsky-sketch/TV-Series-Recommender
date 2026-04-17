import React, { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { Show } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ShowFormProps {
  onShowsChange: (shows: Show[]) => void;
  shows: Show[];
}

export function ShowForm({ onShowsChange, shows }: ShowFormProps) {
  const [newShow, setNewShow] = useState('');

  const addShow = () => {
    if (!newShow.trim()) return;
    const show: Show = {
      id: crypto.randomUUID(),
      title: newShow.trim(),
      rating: 5,
    };
    onShowsChange([...shows, show]);
    setNewShow('');
  };

  const removeShow = (id: string) => {
    onShowsChange(shows.filter(s => s.id !== id));
  };

  const updateRating = (id: string, rating: number) => {
    onShowsChange(shows.map(s => s.id === id ? { ...s, rating } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newShow}
          onChange={(e) => setNewShow(e.target.value)}
          placeholder="Add show..."
          className="flex-1 bg-brand-surface border border-brand-border-light rounded-[4px] px-3 py-2 text-sm focus:outline-none focus:border-brand-accent transition-all placeholder:text-[#666]"
          onKeyDown={(e) => e.key === 'Enter' && addShow()}
        />
        <button
          onClick={addShow}
          className="bg-brand-accent hover:bg-brand-accent/80 px-4 py-2 rounded-[4px] transition-colors cursor-pointer font-bold text-xs"
        >
          ADD
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {shows.map((show) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="geometric-card flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-[13px] font-medium text-white">{show.title}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateRating(show.id, star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-2.5 h-2.5 transition-colors",
                          star <= show.rating ? "fill-brand-gold text-brand-gold" : "text-[#333]"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeShow(show.id)}
                className="text-[#666] hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {shows.length < 3 && (
          <p className="text-[10px] text-[#444] uppercase tracking-widest text-center py-4">
            Need {3 - shows.length} more entry
          </p>
        )}
      </div>
    </div>
  );
}
