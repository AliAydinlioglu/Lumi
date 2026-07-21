import Dexie, { type EntityTable } from 'dexie';

export interface Deck {
  id?: number;
  name: string;
  languages: string[]; // Array of N languages (e.g. ["Dutch", "English", "Turkish"])
  createdAt: number;
}

export interface Card {
  id?: number;
  deckId: number;
  sides: string[]; // Array of N strings corresponding to the languages array
  createdAt: number;
  nextReview: number;
  level: number; // For spaced repetition
}

// A global multi-lingual dictionary map
export interface DictionaryWord {
  id?: number;
  // Dynamic keys for any language added
  [language: string]: any; 
}

const db = new Dexie('LumiOfflineDatabase') as Dexie & {
  decks: EntityTable<Deck, 'id'>;
  cards: EntityTable<Card, 'id'>;
  dictionary: EntityTable<DictionaryWord, 'id'>;
};

// Schema definition - version 3 supports N-lingual dictionary maps
db.version(3).stores({
  decks: '++id, name, createdAt',
  cards: '++id, deckId, nextReview', 
  dictionary: '++id, English, Dutch, Turkish' // Indexing the specific languages we generated so we can search by them
});

export { db };
