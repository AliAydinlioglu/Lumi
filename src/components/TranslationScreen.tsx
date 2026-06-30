"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TranslationScreen() {
  const [inputWord, setInputWord] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('nl'); // Dutch by default
  const [targetLanguages, setTargetLanguages] = useState(['en', 'tr']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<{ [key: string]: string } | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    setIsTranslating(true);
    setTranslations(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: inputWord.trim(),
          sourceLanguage,
          targetLanguages,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setTranslations(data.translations);
      } else {
        console.error('Translation failed:', data.error);
        alert('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Translation Input Form */}
      <form onSubmit={handleTranslate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="Enter a word to translate..."
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            fontSize: '1.2rem',
            borderRadius: '1rem',
            border: '1px solid var(--glass-border)',
            background: 'rgba(15, 23, 42, 0.5)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isTranslating}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '1rem',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            cursor: isTranslating ? 'not-allowed' : 'pointer',
            opacity: isTranslating ? 0.7 : 1,
            transition: 'transform 0.2s',
          }}
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </button>
      </form>

      {/* Translation Results Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {translations && targetLanguages.map((lang, index) => (
            <motion.div
              key={lang}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '1rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {lang === 'en' ? 'English' : lang === 'tr' ? 'Turkish' : lang}
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                {translations[lang]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Placeholder before search */}
        {!translations && !isTranslating && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
            Type a word and hit translate to see results instantly across languages!
          </div>
        )}
      </div>
    </div>
  );
}
