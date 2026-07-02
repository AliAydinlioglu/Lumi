import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { words, translations, languages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const searchWord = word.trim().toLowerCase();

    // 1. Check if the word already exists in the database
    const existingWord = await db.query.words.findFirst({
      where: (words, { eq, and }) => and(
        eq(words.text, searchWord),
        eq(words.sourceLanguage, sourceLanguage)
      ),
      with: {
        translations: true
      }
    });

    if (existingWord) {
      // Check if we have ALL the requested target languages cached
      const existingLanguages = existingWord.translations.map(t => t.languageCode);
      const missingLanguages = targetLanguages.filter(lang => !existingLanguages.includes(lang));

      if (missingLanguages.length === 0) {
        // Full cache hit! Return instantly
        const responseTranslations: { [key: string]: string } = {};
        existingWord.translations.forEach(t => {
          if (targetLanguages.includes(t.languageCode)) {
            responseTranslations[t.languageCode] = t.translatedText;
          }
        });

        console.log(`Cache hit for "${searchWord}"! Skipping Gemini API.`);
        return NextResponse.json({
          success: true,
          word: existingWord,
          translations: responseTranslations,
          cached: true
        });
      }
      
      // If we are missing languages, we will continue and ask Gemini for them
      console.log(`Partial cache hit for "${searchWord}". Missing: ${missingLanguages.join(', ')}. Querying Gemini...`);
    } else {
      console.log(`Cache miss for "${searchWord}". Querying Gemini...`);
    }

    // 2. Query Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Translate the word "${searchWord}" from ${sourceLanguage} to the following languages: ${targetLanguages.join(', ')}.
      
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

    // 3. Ensure languages exist in the database before inserting
    const languageEntries = [
      { code: sourceLanguage, name: sourceLanguage.toUpperCase() },
      ...targetLanguages.map((langCode: string) => ({ code: langCode, name: langCode.toUpperCase() }))
    ];
    await db.insert(languages).values(languageEntries).onConflictDoNothing();

    // 4. Save/Update to database
    let currentWord = existingWord;

    if (!currentWord) {
      const [inserted] = await db.insert(words).values({
        text: searchWord,
        sourceLanguage: sourceLanguage,
      }).returning();
      currentWord = { ...inserted, translations: [] }; // Mock the translations array for logic below
    }

    // Insert only the missing translations to prevent duplicates
    const newTranslationEntries = targetLanguages
      .filter((langCode: string) => !currentWord?.translations.some(t => t.languageCode === langCode))
      .map((langCode: string) => ({
        wordId: currentWord!.id,
        languageCode: langCode,
        translatedText: parsedResponse.translations[langCode].toLowerCase(),
      }));

    if (newTranslationEntries.length > 0) {
      await db.insert(translations).values(newTranslationEntries);
    }

    return NextResponse.json({ 
      success: true, 
      word: currentWord,
      translations: parsedResponse.translations,
      cached: false
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
