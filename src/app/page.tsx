"use client";

import { motion } from "framer-motion";
import TranslationScreen from "@/components/TranslationScreen";

export default function Home() {
  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}
      >
        <h1 className="heading-xl">Translate & Learn</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>
          Real-time, multi-language translation and flashcards.
        </p>
      </motion.div>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ 
          width: '100%', 
          maxWidth: '1000px', 
          padding: '2rem', 
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        <TranslationScreen />
      </motion.div>
    </main>
  );
}
