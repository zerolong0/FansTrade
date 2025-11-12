'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 text-glow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Follow the Best.
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Trade Like a Pro.
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Social trading platform powered by AI. Follow top crypto traders
            and replicate their strategies automatically.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/traders">
              <Button size="lg" className="btn-primary text-lg px-8">
                <TrendingUp className="w-5 h-5 mr-2" />
                Explore Traders
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="btn-secondary text-lg px-8">
              <Zap className="w-5 h-5 mr-2" />
              How It Works
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-glow mb-2">100+</p>
              <p className="text-muted-foreground">Active Traders</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-glow mb-2">10K+</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-success mb-2">78%</p>
              <p className="text-muted-foreground">Avg Win Rate</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
