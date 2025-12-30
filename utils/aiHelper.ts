import { GoogleGenAI } from "@google/genai";

// Helper to get the AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Writing assistance
export async function askGemini(prompt: string, currentText?: string): Promise<string> {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
    let contentPrompt = prompt;
    
    if (currentText && currentText.trim().length > 0) {
      contentPrompt = `
        You are a helpful writing assistant. 
        Here is the current text: "${currentText}".
        
        User instruction: ${prompt}
        
        Return ONLY the updated text. Do not add quotes or conversational filler.
      `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contentPrompt,
      config: {
        systemInstruction: "You are a sophisticated AI writing assistant embedded in a minimalist workspace. Keep formatting clean (Markdown).",
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I couldn't process that request right now.";
  }
}

// Reminder analysis using Google GenAI
export async function parseReminderWithAI(text: string): Promise<{ title: string; timestamp: number } | null> {
    try {
        const ai = getAI();
        const now = new Date();
        
        // CRITICAL FIX: Pass local time string so AI understands the user's timezone context.
        // using .toString() gives something like "Mon Oct 28 2024 12:00:00 GMT+0300 (Moscow Standard Time)"
        const localTimeContext = now.toString(); 

        const systemPrompt = `
            You are an intelligent scheduling assistant.
            
            Context:
            The user's current local time is: ${localTimeContext}
            
            Task:
            Analyze the input text. If it contains a time/date for an event, extract it relative to the user's local time.
            
            Examples:
            - If user says "meeting at 16:00" and local time is 10:00, it means 16:00 TODAY.
            - If user says "tomorrow 9am", calculate the date for tomorrow based on the local time provided.
            
            Output:
            Return a JSON object.
            If it IS a reminder:
            {
                "isReminder": true,
                "title": "Clean title",
                "isoDateTime": "ISO 8601 string (e.g. 2024-10-28T16:00:00.000+03:00)"
            }
            Important: The isoDateTime MUST include the correct timezone offset matching the user's local time provided above.
            
            If NO reminder:
            { "isReminder": false }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: text,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                temperature: 0.1,
            }
        });

        const content = response.text;
        if (!content) return null;

        const data = JSON.parse(content);

        if (data.isReminder && data.isoDateTime && data.title) {
            return {
                title: data.title,
                timestamp: new Date(data.isoDateTime).getTime()
            };
        }

        return null;

    } catch (error) {
        console.error("Gemini Parsing Error:", error);
        return null;
    }
}

// Test Connection for Google GenAI
export async function testAIConnection(): Promise<string> {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Ping. Are you online? Reply with 'Pong'.",
        });

        return `API Success! Response: ${response.text}`;
    } catch (error) {
        return `Connection Failed: ${error}`;
    }
}