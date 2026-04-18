import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, Recommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getRecommendations(prefs: UserPreferences): Promise<Recommendation[]> {
  const systemInstruction = `You are a professional TV Show Consultant.
  Your goal is to provide deeply personalized, high-quality movie and TV show suggestions.
  
  For EVERY recommendation you MUST:
  1. Provide a brief summary (no spoilers).
  2. Explain why it matches the user's specific taste based on their watched history and ratings.
  3. List the Genre and Average Rating.
  4. Generate a YouTube trailer search link in this EXACT format: https://www.youtube.com/results?search_query=[Series+Name]+official+trailer (Replace [Series+Name] with the actual title).
  
  CRITICAL REQUIREMENTS:
  1. Ensure the 'title' is the official full title of the show/movie.
  2. Only suggest content available on the user's platforms if specified.
  3. Respect the age rating and content type filters strictly.`;

  const prompt = `User's Watched History & Ratings:
  ${prefs.watchedShows.map(s => `- ${s.title}: ${s.rating}/5 stars`).join('\n')}
  
  Available Streaming Platforms: ${prefs.streamingApps.length > 0 ? prefs.streamingApps.join(', ') : 'Any'}
  Desired Content Type: ${prefs.contentType}
  Max Age Rating: ${prefs.ageRating}
  
  Recommended 5 titles as a professional consultant.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING, description: "Brief summary without spoilers" },
            reason: { type: Type.STRING, description: "Detailed explanation of why it matches the request" },
            genre: { type: Type.STRING },
            averageRating: { type: Type.STRING, description: "Average rating (e.g. 8.5/10)" },
            trailerLink: { type: Type.STRING, description: "YouTube search link for trailer" },
            type: { type: Type.STRING, enum: ["Movie", "TV Show"] },
            streamingOn: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Subset of user's platforms that feature this content"
            }
          },
          required: ["title", "summary", "reason", "genre", "averageRating", "trailerLink", "type"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "[]");
    
    // Safety check: ensure it's an array and has the required fields
    if (!Array.isArray(data)) {
      console.warn("Gemini returned non-array data:", data);
      return [];
    }
    
    // Filter out invalid recommendations
    return data.filter(rec => rec && rec.title && rec.reason);
  } catch (e) {
    console.error("Failed to parse Gemini recommendations. Raw response:", response.text, e);
    return [];
  }
}
