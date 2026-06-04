'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { UtensilsCrossed, QrCode, ChefHat, BarChart3, ArrowRight, Coffee, Leaf } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Coffee className="h-10 w-10 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight">
              Buna Be<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Net</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-2 font-medium">Traditional Ethiopian Restaurant</p>
            <p className="text-gray-400 mb-10">Addis Ababa, Ethiopia</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cashier">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-white/60 px-6 py-3 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-gray-800">Cashier Dashboard</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              </Link>
              <Link href="/admin">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 cursor-pointer">
                    <ChefHat className="h-5 w-5 text-white" />
                    <span className="font-semibold text-white">Admin Panel</span>
                    <ArrowRight className="h-4 w-4 text-white/70" />
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            { icon: QrCode, title: 'QR Code Ordering', desc: 'Scan, browse, order — no app download needed', color: 'from-amber-500 to-orange-500' },
            { icon: UtensilsCrossed, title: 'Cash Only', desc: 'Pay at your table. No online payment hassle', color: 'from-orange-500 to-red-500' },
            { icon: Leaf, title: 'Fresh & Authentic', desc: 'Traditional recipes with the finest ingredients', color: 'from-green-500 to-emerald-500' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white/70 backdrop-blur-lg border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
