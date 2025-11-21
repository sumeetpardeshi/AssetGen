import { GoogleGenAI, Type } from "@google/genai";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const analyzeProductImage = async (productImage: File): Promise<{ modelDescription: string, scenario: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(productImage);

  const prompt = `You are a creative director for a high-end retail brand. Analyze the uploaded product image.
  
  1. Identify the item (e.g., Indian Kurta, Smartwatch, Handbag) and its style/cultural context.
  2. GENERATE 'modelDescription': A concise, specific description for a model that would look authentic and professional with this product. 
     - CRITICAL: If the product is culturally specific (e.g., Indian Kurta), specify the appropriate ethnicity (e.g., Indian) and style. 
     - Include gender, age range, and pose.
  3. GENERATE 'scenario': A complimentary commercial background setting.
  
  Return JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [imagePart, { text: prompt }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          modelDescription: { type: Type.STRING },
          scenario: { type: Type.STRING },
        },
        required: ["modelDescription", "scenario"]
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.warn("Failed to parse analysis JSON", e);
    }
  }
  
  return { modelDescription: "", scenario: "" };
};

export const generateMarketingAsset = async (
  productImage: File,
  modelDescription: string,
  scenario: string,
  modelImage?: File | null
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare parts
  const parts: any[] = [];

  // 1. Add Product Image (Primary Reference)
  const productPart = await fileToGenerativePart(productImage);
  parts.push(productPart);

  // 2. Add Model Image if provided (Secondary Reference)
  if (modelImage) {
    const modelPart = await fileToGenerativePart(modelImage);
    parts.push(modelPart);
  }

  // 3. Construct the prompt
  let prompt = `You are a professional high-end retail photographer and photo editor.
  
  Task: Generate a photorealistic marketing image featuring the product in the first image provided.
  
  1. PRODUCT: The first image contains the specific product to be sold. You must preserve the key details, colors, and patterns of this product as much as possible in the final generation.
  `;

  if (modelImage) {
    prompt += `2. MODEL REFERENCE: The second image provided is a reference for the model's appearance (pose, ethnicity, or style). Use this as a strong guide for the person in the final image. `;
  }

  prompt += `
  3. MODEL DESCRIPTION: The product should be worn or used by a model matching this description: "${modelDescription}". Ensure the model's ethnicity, age, and style are culturally appropriate for the product (e.g., if the product is an Indian Kurta, the model should look naturally Indian).
  
  4. SCENARIO/BACKGROUND: The setting is: "${scenario || 'A neutral, high-quality studio background with soft lighting suitable for e-commerce'}".
  
  5. QUALITY: The final image must look like a finished commercial advertisement. High resolution, perfect lighting, correct anatomy, and natural composition.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        // Thinking budget not strictly necessary for image gen but good for reasoning about complex prompts if supported in future updates for this model.
        // For now, we rely on the standard image generation capabilities.
      }
    });

    // Parse response for image
    // The response structure for image generation usually contains the image in inlineData within candidates
    // Or it might be a text response if it refused. 
    // We need to handle the specific shape of gemini-2.5-flash-image response.
    
    // Iterate parts to find the image
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No content generated");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    // If we only got text back, it might be an error or refusal
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Generation failed: ${textPart.text}`);
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};