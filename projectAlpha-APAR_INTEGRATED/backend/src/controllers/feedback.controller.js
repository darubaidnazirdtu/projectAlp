import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

const getGeminiModel = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new ApiError(500, 'Gemini API Key is not configured');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
};

const parseExcelFile = (buffer) => {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet);
    } catch (error) {
        throw new ApiError(400, 'Invalid file format. Please upload a valid Excel or CSV file.');
    }
};

const analyzeFeedback = async (req, res, promptContext) => {
    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
    }

    const data = parseExcelFile(req.file.buffer);
    if (!data || data.length === 0) {
        throw new ApiError(400, 'File is empty or could not be parsed');
    }

    // Convert data to string for the prompt
    // Gemini 2.0 Flash has a huge context window, so we can increase this limit significantly.
    // 1M characters is roughly 250k tokens, comfortably within the limit.
    const dataString = JSON.stringify(data).substring(0, 1000000);

    const model = getGeminiModel();
    const prompt = `
        Context: ${promptContext}
        
        Data:
        ${dataString}

        Please analyze the provided feedback data and give a detailed report containing:
        1. Key Strengths
        2. Areas for Improvement
        3. Specific Recommendations
        4. Sentinel/Mood Analysis (Overall sentiment)

        Format the output in clean Markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json(
            new ApiResponse(200, { analysis: text }, 'Analysis completed successfully')
        );
    } catch (error) {
        console.error('Gemini API Error:', error);

        if (error.status === 429) {
            throw new ApiError(429, 'Quota exceeded. Please wait a moment and try again.');
        }

        throw new ApiError(502, 'Failed to generate analysis from AI service');
    }
};
export const analyzeFacultyFeedback = asyncHandler(async (req, res) => {
    await analyzeFeedback(
        req,
        res,
        `
You are an expert academic quality assurance analyst.

Analyze FACULTY feedback data.

Instructions:
- First provide ANALYSIS, then SUGGESTIONS.
- Use only the provided information.
- Do not mention any names (institutions, departments, individuals, companies).
- Keep the response concise and professionally formatted.
- Use Markdown with clear metric-based headings.

Focus Metrics:
Teaching Effectiveness, Subject Knowledge, Communication, Student Engagement, Assessment Fairness
`
    );
});

export const analyzeCourseFeedback = asyncHandler(async (req, res) => {
    await analyzeFeedback(
        req,
        res,
        `
You are an expert academic curriculum analyst.

Analyze COURSE/SUBJECT feedback data.

Instructions:
- First provide ANALYSIS, then SUGGESTIONS.
- Use only the provided information.
- Do not mention any names.
- Keep the response concise and professionally formatted.
- Use Markdown with clear metric-based headings.

Focus Metrics:
Content Relevance, Difficulty Level, Learning Outcomes, Practical Exposure, Assessment Design
`
    );
});


export const analyzeProgramFeedback = asyncHandler(async (req, res) => {
    await analyzeFeedback(
        req,
        res,
        `
You are an expert academic program evaluator.

Analyze DEGREE PROGRAM feedback data.

Instructions:
- First provide ANALYSIS, then SUGGESTIONS.
- Use only the provided information.
- Do not mention any names.
- Keep the response concise and professionally formatted.
- Use Markdown with clear metric-based headings.

Focus Metrics:
Curriculum Alignment, Industry Relevance, Graduate Readiness, Skill Development, Career Support
`
    );
});
