"use client";

import { useState } from 'react';
import Flashcard from "@/components/Flashcard";
import DeckManager from "@/components/DeckManager";
import DictionarySearch from "@/components/DictionarySearch";

export default function FlashcardsPage() {
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#ffffff',
      fontFamily: 'var(--font-mono)'
    }}>
      <DeckManager onSelectDeck={setSelectedDeckId} />
      {/* Passing the selected deck ID down to the Flashcard component so it knows which words to show */}
      <Flashcard deckId={selectedDeckId} />
      
      {/* Show the offline dictionary search panel when a deck is selected */}
      {selectedDeckId && <DictionarySearch deckId={selectedDeckId} />}
    </div>
  );
}
