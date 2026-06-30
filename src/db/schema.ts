import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// The source word that needs translation
export const words = pgTable('words', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  sourceLanguage: text('source_language').notNull().default('nl'), // E.g., 'nl' if they type Dutch first
  createdAt: timestamp('created_at').defaultNow(),
});

// A specific language code and name (e.g., 'en', 'English')
export const languages = pgTable('languages', {
  code: text('code').primaryKey(), // E.g., 'en', 'nl', 'tr'
  name: text('name').notNull(),
});

// The translations for a given word
export const translations = pgTable('translations', {
  id: serial('id').primaryKey(),
  wordId: integer('word_id').references(() => words.id, { onDelete: 'cascade' }).notNull(),
  languageCode: text('language_code').references(() => languages.code, { onDelete: 'cascade' }).notNull(),
  translatedText: text('translated_text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations for easier querying
export const wordsRelations = relations(words, ({ many }) => ({
  translations: many(translations),
}));

export const translationsRelations = relations(translations, ({ one }) => ({
  word: one(words, {
    fields: [translations.wordId],
    references: [words.id],
  }),
  language: one(languages, {
    fields: [translations.languageCode],
    references: [languages.code],
  }),
}));
