'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative text-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 ring-4 ring-white/20">
          <UtensilsCrossed className="h-10 w-10 text-white" />
        </motion.div>
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl font-semibold text-white mb-2">Page Not Found</p>
        <p className="text-white/60 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all">
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
