"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeckManager({ onSelectDeck }: { onSelectDeck: (deckId: number) => void }) {
  const decks = useLiveQuery(() => db.decks.toArray());
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Dutch', 'English', 'Turkish']);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || languages.some(l => !l.trim())) return;
    
    await db.decks.add({
      name,
      languages,
      createdAt: Date.now()
    });
    
    setName('');
    setIsCreating(false);
  };

  return (
    <div style={{
      position: 'absolute',
      left: '2rem',
      top: '5rem',
      bottom: '2rem',
      width: '350px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      color: 'white',
      zIndex: 20
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Your Lists</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
        {decks?.map(deck => (
          <motion.div
            key={deck.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => deck.id && onSelectDeck(deck.id)}
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{deck.name}</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{deck.languages.join(' → ')}</p>
          </motion.div>
        ))}
        {decks?.length === 0 && !isCreating && (
          <p style={{ opacity: 0.5, textAlign: 'center', marginTop: '2rem' }}>No lists found. Create one to start studying!</p>
        )}
      </div>

      <AnimatePresence>
        {isCreating ? (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              type="text"
              placeholder="List Name (e.g. Travel Basics)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.75rem',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {languages.map((lang, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={lang} 
                    placeholder={`Side ${index + 1} Language`}
                    onChange={e => {
                      const newLangs = [...languages];
                      newLangs[index] = e.target.value;
                      setLanguages(newLangs);
                    }}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}
                  />
                  {languages.length > 2 && (
                    <button type="button" onClick={() => setLanguages(languages.filter((_, i) => i !== index))} style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setLanguages([...languages, ''])}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                + Add Another Side
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'white', border: 'none', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Create
              </button>
            </div>
          </motion.form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'white',
              border: 'none',
              color: 'black',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            + Create New List
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
