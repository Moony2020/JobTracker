const express = require('express');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const User = require('../models/User'); // Import User model
const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// Helper to sleep for a bit
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback logic for AI calls using Groq
async function generateContentWithFallback(prompt) {
    const models = [
        "llama-3.3-70b-versatile",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
        "llama-3.1-8b-instant"
    ];
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting AI with Groq model: ${modelName}`);
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                model: modelName,
                temperature: 0.1, // Lower temperature for more consistent JSON
                max_tokens: 4096,
            });

            const content = chatCompletion.choices[0]?.message?.content || '';
            
            // Artificial response object to maintain compatibility with .text() calls
            return {
                text: () => content
            };
        } catch (err) {
            console.error(`Groq Model ${modelName} failed:`, err.message);
            lastError = err;
            
            // If Rate Limit (429), wait and try next
            if (err.status === 429) {
                console.log(`Groq rate limit hit for ${modelName}. Trying next model...`);
                // Only sleep if it's the very last model
                if (modelName === models[models.length - 1]) {
                    await sleep(2000);
                }
                continue;
            }
            
            // For other errors, try next model immediately
            continue;
        }
    }
    throw lastError;
}

router.post('/parse', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'No text provided' });
        }

        const prompt = `
            Extract the following information from this job description and return it as a JSON object:
            - jobTitle: The job title (e.g., "Fullstack Developer")
            - company: The company name (e.g., "Google")
            - location: The location if mentioned (e.g., "Stockholm, Sweden" or "Remote")
            - status: Default this to "applied"
            - notes: A brief 1-2 sentence summary of requirements.
            - jobLink: The URL to the job posting if found.
            - expectedSalary: Any salary range mentioned in the description.

            Job Description:
            ${text}

            Return ONLY the JSON object, no markdown or extra text.
        `;

        const response = await generateContentWithFallback(prompt);
        const resultText = response.text();
        
        // Clean up response in case Gemini adds markdown code blocks
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Raw AI Response (Parse):', resultText);
            throw new Error('Could not parse AI response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        res.json(parsedData);
    } catch (error) {
        console.error('AI Parse error:', error.message);
        res.status(500).json({ message: 'Failed to parse job description with AI', details: error.message });
    }
});

// Note: Individual interview-prep, resume-tips, and follow-up routes have been removed 
// in favor of the /full-prep route to save API quota.

// New Endpoint: Generate Follow-up Email Draft
// Consolidated Endpoint: Generate all insights in one request (Saves 66% Quota)
router.post('/full-prep', auth, async (req, res) => {
    try {
        const { jobTitle, company, notes, status, lastUpdate, language, userProfile } = req.body;
        const targetLang = language || 'the input language';

        const prompt = `
            Analyze this job application and provide SIX sections in a single JSON response:
            1. matchScore: A number (0-100) based on USER PROFILE vs Job TITLE and COMPANY.
            2. matchReason: A short (1-2 sentence) explanation of why this score was given (e.g., "Matches tech stack" or "Missing relevant experience").
            3. interview: an array of 5 objects, each with: "question", "answer", and "hint" (1-sentence hint for quiz mode).
            4. resume: 5 specific bullet point tips to improve their resume for THIS role.
            5. email: A professional, short follow-up email draft.
            6. coverLetter: A full, professional cover letter draft (3-4 paragraphs) tailored precisely to this role and company.

            Job: ${jobTitle} at ${company}
            User Profile (Resume/CV Data): ${userProfile || "NOT PROVIDED. If not provided, you MUST warn the user in matchReason to add their profile in settings."}
            User Specific Application Notes: ${notes || "None provided by user."}

            PRIORITY MATCHING RULE: 
            - Calculate matchScore primarily by comparing "Job TITLE/COMPANY" against "User Profile".
            - If "User Profile" is missing, give a low/conservative score and explain why in matchReason.
            - "Application Notes" are secondary details.

            JSON structure:
            {
                "matchScore": 85,
                "matchReason": "Explanation here...",
                "interview": [{"question": "...", "answer": "...", "hint": "..."}],
                "resume": ["tip1", "tip2", "..."],
                "email": "Draft text...",
                "coverLetter": "Full letter text..."
            }

            LANGUAGE RULES:
            - Generate all content in ${targetLang}.
            - Return ONLY the JSON object.
        `;

        const response = await generateContentWithFallback(prompt);
        const resultText = response.text();
        
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Raw AI Response (Full Prep) failed to find JSON:', resultText);
            throw new Error('AI returned an invalid format. Please try again.');
        }

        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        console.error('AI Full Prep Failure:', error);
        
        let statusCode = error.status || 500;
        let retryAfterSeconds = 0;

        // Groq errors usually have a message containing the wait time if 429
        if (statusCode === 429 && error.message) {
            const match = error.message.match(/try again in ([\d.]+)(s|ms|m)/);
            if (match) {
                const unit = match[2];
                const val = parseFloat(match[1]);
                retryAfterSeconds = unit === 'm' ? val * 60 : unit === 'ms' ? val / 1000 : val;
            }
        }

        res.status(statusCode).json({ 
            error: statusCode === 429 ? "QUOTA_EXCEEDED" : "INTERNAL_ERROR",
            message: statusCode === 429 ? 'AI rate limit hit. This is common on free tiers.' : 'Failed to generate career prep insights', 
            retryAfter: Math.ceil(retryAfterSeconds) || (statusCode === 429 ? 10 : 0), // Default 10s if 429
            details: error.message
        });
    }
});

// New Endpoint: Recommend Job Titles based on CV
router.get('/recommend-jobs', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || (!user.profile && !user.name)) {
            return res.json({ recommendations: [] });
        }

        const prompt = `
            Analyze this user's professional background and recommend 5 specific job titles they should search for.
            Focus on titles that match their likely skills based on their profile text.
            
            User's CV Profile: ${user.profile || "Not detailed"}
            User's Name: ${user.name}

            Return ONLY a JSON object with this structure:
            {
                "recommendations": [
                    { "title": "Senior Frontend Developer" },
                    { "title": "React Engineer" }
                ]
            }
        `;

        // Use a smaller model first for recommendations to save 70B model daily quota
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
        }).catch(async (err) => {
            // Fallback to main chain if 8B fails
            const response = await generateContentWithFallback(prompt);
            return { choices: [{ message: { content: response.text() } }] };
        });

        const resultText = chatCompletion.choices[0]?.message?.content || '';
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response');

        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        console.error('Job Recommendation Failure:', error.message);
        
        // Return 200 with empty list instead of 500 to keep UI clean
        res.json({ recommendations: [] });
    }
});

// Legacy routes removed to prevent multiple requests. 
// Use /full-prep for all career insight needs.

module.exports = router;
