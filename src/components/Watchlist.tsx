import React from 'react';
import { WatchlistItem } from '../types';
import { Bookmark, X, Film, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
}

export function Watchlist({ items, onRemove }: WatchlistProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-[#444] uppercase tracking-widest text-[10px]"
          >
            Your watchlist is empty
          </motion.div>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="geometric-card flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="text-brand-accent/50 p-1 bg-white/5 rounded">
                  {item.type === 'Movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-white">{item.title}</span>
                  <span className="text-[9px] text-[#555] uppercase tracking-tighter">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="text-[#666] hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
