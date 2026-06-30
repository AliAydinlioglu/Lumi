import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { words, translations, languages } from '@/db/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { word, sourceLanguage, targetLanguages } = await req.json();

    if (!word || !sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct a strict prompt for JSON output
    const prompt = `
      Translate the word "${word}" from ${sourceLanguage} to the following languages: ${targetLanguages.join(', ')}.
      
      Respond STRICTLY in JSON format. Do not include any markdown formatting, just the raw JSON object.
      The structure must be:
      {
        "translations": {
          "language_code": "translated_word"
        }
      }
      Example if translating 'hello' to nl and tr:
      {
        "translations": {
          "nl": "hallo",
          "tr": "merhaba"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting from Gemini
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedResponse = JSON.parse(text);

    // Save to database
    // 1. Insert the source word
    const [insertedWord] = await db.insert(words).values({
      text: word.toLowerCase(),
      sourceLanguage: sourceLanguage,
    }).returning();

    // 2. Ensure languages exist in the database before inserting translations
    const languageEntries = [
      { code: sourceLanguage, name: sourceLanguage.toUpperCase() },
      ...targetLanguages.map((langCode: string) => ({ code: langCode, name: langCode.toUpperCase() }))
    ];
    
    // In Drizzle for postgres, we use onConflictDoNothing for simple upserts where we just want it to exist
    await db.insert(languages).values(languageEntries).onConflictDoNothing();

    // 3. Insert the translations
    const translationEntries = targetLanguages.map((langCode: string) => ({
      wordId: insertedWord.id,
      languageCode: langCode,
      translatedText: parsedResponse.translations[langCode].toLowerCase(),
    }));

    await db.insert(translations).values(translationEntries);

    return NextResponse.json({ 
      success: true, 
      word: insertedWord,
      translations: parsedResponse.translations 
    });

  } catch (error: any) {
    console.error('Translation error message:', error.message);
    console.error('Translation error cause:', error.cause);
    console.error('Translation error detail:', error.detail);
    return NextResponse.json({ 
      error: 'Failed to translate: ' + error.message, 
      detail: error.detail,
      cause: error.cause 
    }, { status: 500 });
  }
}
