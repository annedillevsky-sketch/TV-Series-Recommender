import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Tv, Sparkles, RefreshCcw, Loader2, ArrowRight, ArrowLeft, Bookmark, Plus, LayoutGrid, List, Share2, Check, LogOut, User as UserIcon } from 'lucide-react';
import { ShowForm } from './components/ShowForm';
import { StreamingApps } from './components/StreamingApps';
import { Preferences } from './components/Preferences';
import { Watchlist } from './components/Watchlist';
import { Login } from './components/Login';
import { Show, AgeRating, ContentType, Recommendation, UserPreferences, WatchlistItem } from './types';
import { getRecommendations } from './services/geminiService';
import { cn } from './lib/utils';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  User
} from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [ageRating, setAgeRating] = useState<AgeRating>('13+');
  const [contentType, setContentType] = useState<ContentType>('Both');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'inputs' | 'watchlist'>('inputs');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // Sync Preferences from Firestore
  useEffect(() => {
    if (!user) return;

    const userDoc = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setShows(data.watchedShows || []);
        setSelectedApps(data.streamingApps || []);
        setAgeRating(data.ageRating || '13+');
        setContentType(data.contentType || 'Both');
      }
    });

    const watchlistCol = collection(db, 'users', user.uid, 'watchlist');
    const unsubWatchlist = onSnapshot(watchlistCol, (snap) => {
      const items = snap.docs.map(d => d.data() as WatchlistItem);
      setWatchlist(items.sort((a, b) => b.addedAt - a.addedAt));
    });

    return () => {
      unsubProfile();
      unsubWatchlist();
    };
  }, [user]);

  // Save Preferences to Firestore
  const savePreferences = async (newShows: Show[], apps: string[], rating: AgeRating, type: ContentType) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        watchedShows: newShows,
        streamingApps: apps,
        ageRating: rating,
        contentType: type,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving preferences:", err);
    }
  };

  const handleFetchRecommendations = async () => {
    setLoading(true);
    setStep(4);
    try {
      const prefs: UserPreferences = {
        watchedShows: shows,
        streamingApps: selectedApps,
        ageRating,
        contentType,
      };
      const data = await getRecommendations(prefs);
      setRecommendations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (rec: { title: string; type: 'Movie' | 'TV Show' }) => {
    if (!user) return;
    if (watchlist.some(item => item.title === rec.title)) return;
    
    const itemId = crypto.randomUUID();
    const newItem = {
      id: itemId,
      title: rec.title,
      type: rec.type,
      addedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'watchlist', itemId), newItem);
      setSidebarTab('watchlist');
    } catch (err) {
      console.error("Error adding to watchlist:", err);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!user) return;
    try {
      // Find the document ID. In our case, the itemId used in the path is the same as the id in the data.
      await deleteDoc(doc(db, 'users', user.uid, 'watchlist', id));
    } catch (err) {
      console.error("Error removing from watchlist:", err);
    }
  };

  const handleShare = async (rec: Recommendation) => {
    const text = `I just found my next obsession on BingeWise: ${rec.title} (${rec.type})!\n\nAI Analysis: ${rec.reason}\n\nCheck it out here: ${window.location.origin}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BingeWise: ${rec.title}`,
          text: text,
          url: window.location.origin,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(text, rec.title);
        }
      }
    } else {
      copyToClipboard(text, rec.title);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setShareFeedback(title);
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const reset = () => {
    setStep(1);
    setIsAnimating(false);
    setRecommendations([]);
  };

  // For nice entrance animations in the main display
  const [isAnimating, setIsAnimating] = useState(false);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden border-brand-border">
      {/* Sidebar: Inputs & Configuration */}
      <aside className={cn(
        "bg-brand-sidebar border-brand-border flex flex-col transition-all duration-500",
        "w-full lg:w-[380px] lg:border-r h-full overflow-y-auto p-6 lg:p-10",
        (recommendations.length > 0 || loading) && "hidden lg:flex"
      )}>
        <div className="flex-grow space-y-6 lg:space-y-10">
          <div>
            <div className="flex items-center justify-between mb-6 lg:mb-10">
              <div className="flex flex-col">
                <div className="text-[10px] lg:text-[12px] tracking-[0.4em] uppercase text-brand-accent font-black">
                  NextWatch
                </div>
                <div className="text-[8px] uppercase text-[#444] font-bold flex items-center gap-1 mt-1">
                  <UserIcon className="w-2 h-2" />
                  {user.displayName || user.email}
                </div>
              </div>
              <div className="flex bg-brand-surface rounded-full p-1 border border-brand-border-light">
                <button 
                  onClick={() => setSidebarTab('inputs')}
                  className={cn(
                    "p-1.5 rounded-full transition-all cursor-pointer",
                    sidebarTab === 'inputs' ? "bg-brand-accent text-white" : "text-[#666] hover:text-[#999]"
                  )}
                  title="Configuration"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setSidebarTab('watchlist')}
                  className={cn(
                    "p-1.5 rounded-full transition-all cursor-pointer",
                    sidebarTab === 'watchlist' ? "bg-brand-accent text-white" : "text-[#666] hover:text-[#999]"
                  )}
                  title="My Watchlist"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {sidebarTab === 'inputs' ? (
                <motion.div
                  key="inputs"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6 lg:space-y-8"
                >
                  <div>
                    <span className="section-title">Recently Watched</span>
                    <ShowForm 
                      shows={shows} 
                      onShowsChange={(newShows) => {
                        setShows(newShows);
                        savePreferences(newShows, selectedApps, ageRating, contentType);
                      }} 
                    />
                  </div>

                  <div>
                    <span className="section-title">Preferences</span>
                    <Preferences 
                      ageRating={ageRating} 
                      contentType={contentType} 
                      onAgeChange={(r) => {
                        setAgeRating(r);
                        savePreferences(shows, selectedApps, r, contentType);
                      }}
                      onTypeChange={(t) => {
                        setContentType(t);
                        savePreferences(shows, selectedApps, ageRating, t);
                      }}
                    />
                  </div>

                  <div className="pb-4">
                    <span className="section-title">Your Platforms</span>
                    <StreamingApps 
                      selectedApps={selectedApps} 
                      onChange={(apps) => {
                        setSelectedApps(apps);
                        savePreferences(shows, apps, ageRating, contentType);
                      }} 
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="watchlist"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <span className="section-title">My Watchlist</span>
                    <Watchlist items={watchlist} onRemove={removeFromWatchlist} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border-light shrink-0">
          {sidebarTab === 'inputs' && (
            <>
              <button
                disabled={shows.length < 3 || loading}
                onClick={handleFetchRecommendations}
                className="w-full bg-brand-accent text-white py-4 rounded-[4px] font-bold uppercase tracking-[0.1em] text-[12px] hover:bg-brand-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Analyzing...' : 'Get Recommendations'}
              </button>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xl lg:text-2xl font-extrabold text-white">{shows.length}</div>
                  <div className="text-[10px] uppercase text-[#555] font-bold">Analyzed</div>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-3 bg-brand-surface rounded-[4px] text-[#666] hover:text-brand-accent transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {sidebarTab === 'watchlist' && (
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xl lg:text-2xl font-extrabold text-white">{watchlist.length}</div>
                <div className="text-[10px] uppercase text-[#555] font-bold">Items</div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-3 bg-brand-surface rounded-[4px] text-[#666] hover:text-brand-accent transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Display: Results & Hero */}
      <main className={cn(
        "flex-1 main-gradient relative p-8 lg:p-16 overflow-y-auto",
        (recommendations.length === 0 && !loading) && "hidden lg:block"
      )}>
        {(recommendations.length > 0 || loading) && (
          <button 
            onClick={reset}
            className="lg:hidden absolute top-4 right-4 z-50 bg-white/5 p-2 rounded-full text-white/60"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        )}
        <AnimatePresence mode="wait">
          {!recommendations.length && !loading ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex flex-col justify-center max-w-lg"
            >
              <div className="bg-[#2A3B2A] text-brand-success px-3 py-1 rounded-[4px] text-[12px] font-bold w-fit mb-4">
                READY FOR ANALYSIS
              </div>
              <h1 className="text-7xl font-extrabold leading-[0.9] tracking-tighter mb-6">
                Discover Your Next Obsession.
              </h1>
              <p className="text-lg text-[#BBB] leading-relaxed mb-8">
                Build your profile in the sidebar to generate a curated watchlist. We analyze your ratings and content preferences to find the perfect matches across your active platforms.
              </p>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <Loader2 className="w-16 h-16 text-brand-accent animate-spin mb-6" />
              <div className="text-center space-y-2">
                <div className="text-brand-accent font-black uppercase tracking-[0.2em] text-xs">Simulating Neural Path</div>
                <div className="text-2xl font-bold">Generating Detailed Recommendations...</div>
                <p className="text-[#666] text-sm font-sans max-w-xs mx-auto">Analyzing story arcs and thematic resonance to find your next obsession.</p>
              </div>
            </motion.div>
          ) : recommendations.length === 0 ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-brand-accent bg-brand-accent/10 p-4 rounded-full">
                <RefreshCcw className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase">No Matches Found</h2>
                <p className="text-[#888] max-w-md mx-auto">We couldn't generate a stable recommendation list. Please try adjusting your preferences or adding more watched shows.</p>
              </div>
              <button onClick={reset} className="bg-white text-black px-8 py-3 rounded-[4px] font-bold uppercase tracking-widest text-xs hover:bg-white/90">
                TRY AGAIN
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-16 pb-32"
            >
              <div className="space-y-4">
                <div className="text-brand-accent text-[10px] font-black uppercase tracking-[0.4em]">Top Pick</div>
                {recommendations.slice(0, 1).map((hero, i) => (
                  <div key={i} className="max-w-[550px]">
                    <div className="bg-[#2A3B2A] text-brand-success px-3 py-2 rounded-[4px] text-[12px] font-bold w-fit mb-4 uppercase tracking-widest shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                      98% Personal Match
                    </div>
                    <h1 className="text-[48px] sm:text-[72px] lg:text-[84px] font-extrabold leading-[0.85] tracking-tighter mb-6 text-white uppercase break-words">
                      {hero.title}
                    </h1>
                    <div className="flex flex-wrap gap-5 text-sm text-[#888] mb-8 font-medium">
                      <span className="flex items-center gap-2 uppercase tracking-widest text-[11px]">
                        {hero.type === 'Movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                        {hero.type}
                      </span>
                      <span>•</span>
                      <span className="uppercase tracking-widest text-[11px] text-brand-gold font-bold">{hero.genre}</span>
                      <span>•</span>
                      <span className="uppercase tracking-widest text-[11px] text-white font-bold">{hero.averageRating}</span>
                      {hero.streamingOn && hero.streamingOn.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-brand-success uppercase tracking-widest text-[11px] font-bold">{hero.streamingOn[0]}</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-6 mb-10">
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[#444] tracking-widest">Summary</div>
                        <p className="text-sm leading-relaxed text-[#888]">
                          {hero.summary}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[#444] tracking-widest">Consultant's Note</div>
                        <p className="text-lg leading-relaxed text-[#BBB]">
                          {hero.reason}
                        </p>
                      </div>

                      <a 
                        href={hero.trailerLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent pb-1 hover:text-white hover:border-white transition-all"
                      >
                        [Watch Trailer]
                      </a>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <button onClick={reset} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-[4px] font-bold uppercase tracking-[0.15em] text-[12px] transition-all cursor-pointer hover:bg-white/10">
                        NEW SEARCH
                      </button>
                      <button 
                        onClick={() => addToWatchlist(hero)} 
                        disabled={watchlist.some(item => item.title === hero.title)}
                        className={cn(
                          "px-8 py-4 rounded-[4px] font-bold uppercase tracking-[0.15em] text-[12px] transition-all cursor-pointer flex items-center gap-2",
                          watchlist.some(item => item.title === hero.title)
                            ? "bg-brand-success/20 text-brand-success border border-brand-success/30 cursor-default"
                            : "bg-brand-accent text-white hover:bg-brand-accent/90 shadow-[0_4px_20px_rgba(229,9,20,0.3)]"
                        )}
                      >
                        <Bookmark className="w-4 h-4" />
                        {watchlist.some(item => item.title === hero.title) ? 'ON WATCHLIST' : 'WATCH LATER'}
                      </button>
                      <button 
                        onClick={() => handleShare(hero)}
                        className="bg-brand-surface border border-brand-border-light text-white px-6 py-4 rounded-[4px] font-bold uppercase tracking-[0.15em] text-[12px] transition-all cursor-pointer hover:border-brand-accent flex items-center gap-2 relative group"
                      >
                        {shareFeedback === hero.title ? <Check className="w-4 h-4 text-brand-success" /> : <Share2 className="w-4 h-4" />}
                        {shareFeedback === hero.title ? 'COPIED' : 'SHARE'}
                        {shareFeedback === hero.title && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-success text-black text-[9px] px-2 py-1 rounded font-black">
                            LINK READY
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <div className="text-[#444] text-[10px] font-black uppercase tracking-[0.4em] border-b border-brand-border pb-4">Also Recommended</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {recommendations.slice(1).map((rec, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="geometric-card p-8 border-brand-border-light hover:border-brand-accent transition-colors relative group/card flex flex-col"
                    >
                      <button 
                        onClick={() => handleShare(rec)}
                        className="absolute top-4 right-4 text-[#444] hover:text-white transition-colors"
                        title="Share Recommendation"
                      >
                        {shareFeedback === rec.title ? <Check className="w-4 h-4 text-brand-success" /> : <Share2 className="w-4 h-4" />}
                      </button>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] uppercase font-black text-brand-accent tracking-[0.2em]">{rec.type}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {rec.streamingOn?.map((app, j) => (
                            <span key={j} className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-[2px] text-[#666] uppercase whitespace-nowrap">{app}</span>
                          ))}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2 uppercase leading-none">{rec.title}</h3>
                      <div className="flex gap-2 text-[8px] uppercase font-bold tracking-widest mb-4">
                        <span className="text-brand-gold">{rec.genre}</span>
                        <span className="text-[#444]">•</span>
                        <span className="text-white">{rec.averageRating}</span>
                      </div>

                      <div className="space-y-4 mb-8 flex-grow">
                        <div className="space-y-1">
                          <div className="text-[9px] uppercase font-bold text-[#333] tracking-widest">Summary</div>
                          <p className="text-[10px] text-[#666] leading-relaxed">
                            {rec.summary}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] uppercase font-bold text-[#333] tracking-widest">Consultant's Note</div>
                          <p className="text-[10px] text-[#888] leading-relaxed italic">
                            {rec.reason}
                          </p>
                        </div>
                        <a 
                          href={rec.trailerLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[8px] font-black text-brand-accent uppercase tracking-[0.2em] border-b border-brand-accent pb-0.5 hover:text-white hover:border-white transition-all w-fit"
                        >
                          [Watch Trailer]
                        </a>
                      </div>
                      <button
                        onClick={() => addToWatchlist(rec)}
                        className={cn(
                          "w-full py-3 rounded-[2px] text-[10px] font-bold uppercase tracking-[0.15em] border transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto",
                          watchlist.some(item => item.title === rec.title)
                            ? "bg-brand-success/10 text-brand-success border-brand-success/20"
                            : "border-white/10 hover:border-brand-accent text-[#666] hover:text-white"
                        )}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {watchlist.some(item => item.title === rec.title) ? 'On Watchlist' : 'Watch Later'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Stats Overlay Bottom Right */}
              <div className="fixed bottom-10 right-10 flex gap-10">
                <div className="text-right">
                  <span className="block text-2xl font-extrabold text-white">
                    {recommendations.reduce((acc, r) => acc + (r.streamingOn ? 1 : 0), 0) > 0 ? 'High' : '8.6'}
                  </span>
                  <span className="text-[10px] uppercase text-[#555] font-bold text-nowrap">Match Accuracy</span>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-extrabold text-white">{recommendations.length}</span>
                  <span className="text-[10px] uppercase text-[#555] font-bold text-nowrap">Recommendations</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
