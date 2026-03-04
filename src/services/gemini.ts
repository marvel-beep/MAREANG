import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function solveMathProblem(base64Image: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this image of a math problem. 
    1. Extract the mathematical expression or problem text.
    2. Solve it step-by-step.
    3. Provide the final result.
    4. Categorize the problem (e.g., Algebra, Calculus, Matrix, Trigonometry, Finance, etc.).

    Return the response in JSON format with the following structure:
    {
      "expression": "the extracted math problem",
      "result": "the final answer",
      "steps": "detailed step-by-step explanation in markdown format",
      "category": "the category of the problem"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          expression: { type: Type.STRING },
          result: { type: Type.STRING },
          steps: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["expression", "result", "steps", "category"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
