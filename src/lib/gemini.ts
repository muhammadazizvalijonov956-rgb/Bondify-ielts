import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const vocabSchema = {
  description: "English Vocabulary Questions",
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING, description: "The vocabulary word being tested" },
          questionType: {
            type: SchemaType.STRING,
            description: "Type of question (context_fill, synonym_match, meaning_selection, error_correction, collocation)"
          },
          question: { type: SchemaType.STRING, description: "The question text, with blanks if needed" },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of 4 possible options including the correct one"
          },
          correctAnswer: { type: SchemaType.STRING, description: "The correct answer from the options" },
          explanation: { type: SchemaType.STRING, description: "A brief, clear explanation of why the answer is correct" },
          exampleSentence: { type: SchemaType.STRING, description: "A natural example sentence using the word" },
          difficulty: { type: SchemaType.NUMBER, description: "The difficulty level (1-5)" },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["word", "questionType", "question", "options", "correctAnswer", "explanation", "exampleSentence", "difficulty", "tags"]
      }
    }
  },
  required: ["questions"]
};

export async function generateVocabularyQuestions(count: number, level: number, weakWords: string[] = []) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: vocabSchema as any,
    }
  });

  const prompt = `Generate ${count} English vocabulary questions.
  Rules:
  - Difficulty level: ${level}
  - Include weak words first: ${weakWords.length > 0 ? weakWords.join(', ') : 'none'}
  - Focus on IELTS vocabulary if level >= 3
  - Mix types:
    - context_fill
    - synonym_match
    - meaning_selection
    - error_correction
    - collocation
  - Use natural English only
  - Avoid duplicates
  - Provide short explanation
  - Provide natural example sentence
  - Ensure questions are high quality and suitable for IELTS preparation if level is 3 or above.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return JSON.parse(response.text());
}
