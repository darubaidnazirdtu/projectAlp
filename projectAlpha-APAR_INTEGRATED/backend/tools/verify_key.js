import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function verifyKey() {
    console.log("----------------------------------------");
    console.log("Verifying Gemini API Key...");

    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file");
        return;
    }

    const keyMasked = process.env.GEMINI_API_KEY.substring(0, 8) + "...";
    console.log(`🔑 Key found: ${keyMasked}`);

    // Using the alias from the available list
    const MODEL_NAME = 'gemini-flash-latest';
    console.log(`🤖 Target Model: ${MODEL_NAME}`);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        console.log("💬 Sending basic prompt: 'Hello, are you working?'");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();

        console.log("✅ SUCCESS! API responded:");
        console.log("----------------------------------------");
        console.log(text);
        console.log("----------------------------------------");
        console.log("The API key is valid and the model is accessible.");

    } catch (error) {
        console.error("❌ FAILED to generate content.");
        console.error("Error details:", error.message);
        if (error.status) console.error("Status:", error.status);
    }
}

verifyKey();
