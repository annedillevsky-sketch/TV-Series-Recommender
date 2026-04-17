import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { motion } from 'motion/react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 main-gradient">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-10"
      >
        <div className="space-y-4">
          <div className="text-[12px] tracking-[0.5em] uppercase text-brand-accent font-black">
            BingeWise
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[0.9] text-white uppercase">
            Start Your <br />Analysis.
          </h1>
          <p className="text-[#666] text-sm lg:text-base leading-relaxed max-w-xs mx-auto">
            Sign in to unlock personalized AI recommendations and manage your global watchlist.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-[4px] font-black uppercase tracking-[0.2em] text-[11px] transition-all cursor-pointer hover:bg-[#EEE] flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="bg-black text-white p-1 rounded-sm">
                  <Mail className="w-3 h-3" />
                </div>
                Continue with Google
              </>
            )}
          </button>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-brand-accent text-[10px] font-bold uppercase"
            >
              {error}
            </motion.div>
          )}
        </div>

        <div className="pt-10 grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-lg font-black text-white">AI</div>
            <div className="text-[8px] uppercase text-[#444] font-bold tracking-widest">Driven</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-white">Free</div>
            <div className="text-[8px] uppercase text-[#444] font-bold tracking-widest">forever</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-white">Safe</div>
            <div className="text-[8px] uppercase text-[#444] font-bold tracking-widest">encrypted</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
