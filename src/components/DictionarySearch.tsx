"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import sampleDict from '@/lib/sample-dictionary.json';

export default function DictionarySearch({ deckId }: { deckId: number }) {
  const [query, setQuery] = useState('');
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  
  // Query the offline dictionary database dynamically based on the deck's FIRST language
  const searchResults = useLiveQuery(
    () => {
      if (!query || !deck || deck.languages.length === 0) return [];
      const primaryLang = deck.languages[0]; // e.g. "English" or "Dutch"
      
      // We look up the word using the primary language index
      return db.dictionary
        .filter(record => {
          // Fallback simple filter in case index isn't properly registered during the version change
          const word = record[primaryLang];
          return typeof word === 'string' && word.toLowerCase().startsWith(query.toLowerCase());
        })
        .toArray();
    },
    [query, deck]
  );

  // Inject sample data into IndexedDB on first load to prove the offline concept
  useEffect(() => {
    // For the prototype, we clear the dictionary and re-inject the multi-lingual dataset
    // so you don't get stuck with the old English-Spanish mock data!
    db.dictionary.clear().then(() => {
      db.dictionary.bulkAdd(sampleDict).catch(console.error);
    });
  }, []);

  const addCard = async (dictionaryRecord: any) => {
    if (!deck) return;
    
    // Dynamically pull the exact translations for EVERY language the user wants in this deck!
    const sides = deck.languages.map(lang => dictionaryRecord[lang] || "(Translation missing)");

    await db.cards.add({
      deckId,
      sides,
      createdAt: Date.now(),
      nextReview: Date.now(),
      level: 0
    });
    setQuery('');
  };

  return (
    <div style={{
      position: 'absolute',
      right: '2rem',
      top: '5rem',
      width: '350px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      color: 'white',
      zIndex: 20
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Offline Dictionary</h3>
      <input 
        type="text" 
        placeholder={`Search ${deck?.languages[0] || 'Offline Database'}...`}
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '0.75rem',
          borderRadius: '8px',
          color: 'white',
          outline: 'none'
        }}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
        {searchResults?.map(res => {
          // Grab the display text for the first two languages so the user knows what they are adding
          const firstLang = deck?.languages[0];
          const secondLang = deck?.languages[1];
          const displayWord = res[firstLang || "English"] || "Unknown";
          const displayTranslation = res[secondLang || "English"] || "";

          return (
            <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{displayWord}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{displayTranslation}</div>
              </div>
              <button 
                onClick={() => addCard(res)}
                style={{ background: 'white', color: 'black', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Add N-Sided Card
              </button>
            </div>
          );
        })}
        {query && searchResults?.length === 0 && (
          <p style={{ opacity: 0.5, textAlign: 'center', fontSize: '0.9rem' }}>No offline matches found.</p>
        )}
      </div>
    </div>
  );
}
