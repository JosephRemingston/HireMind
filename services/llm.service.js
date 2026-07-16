import { GoogleGenerativeAI } from "@google/generative-ai";

let _client = null;

function getClient() {
    if (!_client) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;
        _client = new GoogleGenerativeAI(apiKey);
    }
    return _client;
}

/**
 * Calls Gemini 1.5 Flash to extract structured resume data from raw text.
 * Returns null if the API key is not set or the call fails — caller falls back
 * to the regex-based parser automatically.
 *
 * @param {string} rawText  — Full text content of the resume PDF
 * @returns {Promise<object|null>} Structured resume data or null on failure
 */
export async function parseResumeWithLLM(rawText) {
    const client = getClient();
    if (!client) return null;

    const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
        },
    });

    const schema = JSON.stringify({
        contact: {
            name: "string | null",
            email: "string | null",
            phone: "string | null",
            linkedin: "string | null",
            github: "string | null",
            location: "string | null",
        },
        summary: "string | null",
        experience: [
            {
                title: "string | null",
                company: "string | null",
                dates: "string | null",
                description: "string | null",
            },
        ],
        education: [
            {
                institution: "string | null",
                degree: "string | null",
                field: "string | null",
                dates: "string | null",
            },
        ],
        skills: [{ name: "string", category: "string" }],
        certifications: [{ name: "string" }],
        projects: [
            {
                name: "string | null",
                description: "string | null",
            },
        ],
    });

    const prompt = `You are a resume parsing engine. Extract structured information from the following resume text and return ONLY a valid JSON object that exactly matches this schema:
${schema}

Rules:
- experience: Each distinct job/role MUST be a separate array entry. NEVER merge multiple jobs into one block.
- skills: Include every technical skill, tool, framework, language and platform mentioned anywhere in the resume. For "category" use one of: Languages, Frameworks, Databases, Cloud, DevOps, Tools, Testing, Data/AI, Mobile, Design, Methodologies.
- If a field is not present in the resume, use null or an empty array as appropriate.
- Return ONLY the JSON object. No markdown fences, no commentary.

Resume text:
---
${rawText}
---`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.trim().replace(/^```(?:json)?|```$/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
    } catch (err) {
        // Non-fatal — caller will fall back to regex parser
        console.warn("[llm.service] Gemini parse failed:", err.message);
        return null;
    }
}
