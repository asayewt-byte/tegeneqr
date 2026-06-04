'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative text-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 ring-4 ring-white/20">
          <AlertTriangle className="h-10 w-10 text-white" />
        </motion.div>
        <h1 className="text-6xl font-bold text-white mb-4">Oops!</h1>
        <p className="text-xl font-semibold text-white mb-2">Something went wrong</p>
        <p className="text-white/60 mb-8 max-w-md mx-auto">An unexpected error occurred. Please try again.</p>
        <Button onClick={reset}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all">
          Try Again
        </Button>
      </motion.div>
    </div>
  );
}
