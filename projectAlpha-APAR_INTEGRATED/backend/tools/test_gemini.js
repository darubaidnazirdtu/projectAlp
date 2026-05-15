import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function findGenerativeModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not found');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('API Error:', data);
            return;
        }

        if (data.models) {
            const contentModels = data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', '')); // Remove prefix for easier reading

            console.log("--- Models supporting generateContent ---");
            console.log(contentModels.join('\n'));
        } else {
            console.log("No models returned.");
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

findGenerativeModels();
