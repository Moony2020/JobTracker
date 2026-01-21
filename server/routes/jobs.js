const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// Helper for AI generation with better fallback and pagination
async function generateJobsWithAI(query, location, page = 1) {
    // Default to Sweden if location is completely missing to avoid US-centric bias
    const searchLocation = location || 'Sweden';
    
    const prompt = `
        Search for real job openings for "${query}" in "${searchLocation}".
        Return 12 REALISTIC, CURRENT jobs (Page ${page}). Random Seed: ${Math.random()}.
        
        RULES:
        1. QUERY: "${query}". If "Restaurant", show Chef/Waiter. If "Driver", show Delivery.
        2. IF NON-TECH: Do NOT show Developer/Engineer roles.
        3. IF VAGUE ("Find Job"): Mix Store, Driver, Admin, Care.
        4. NO DUPLICATES. Vary companies.
        5. JSON ONLY.

        Fields: title, company, location, type, posted, description (2 sentences), url (Search URL).
        Output: [{"title":"...","company":"...","location":"...","type":"...","posted":"...","description":"...","url":"..."}]
    `;

    const models = [
        "llama-3.3-70b-versatile", // Primary
        "llama-3.1-8b-instant"     // Backup
    ];

    let lastError = null;
    for (const modelName of models) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: modelName,
                temperature: 0.7, // Increased slightly for more variety
            });

            const content = chatCompletion.choices[0]?.message?.content || '';
            
            // More robust JSON cleaning
            let cleanedContent = content;
            const openBracket = content.indexOf('[');
            const closeBracket = content.lastIndexOf(']');
            if (openBracket !== -1 && closeBracket !== -1 && closeBracket > openBracket) {
                cleanedContent = content.substring(openBracket, closeBracket + 1);
            }

            try {
                if (!cleanedContent || !cleanedContent.trim().startsWith('[')) {
                    throw new Error('Invalid JSON format received');
                }
                const parsedJobs = JSON.parse(cleanedContent);
                
                // Server-side Deduplication
                const uniqueJobs = [];
                const seen = new Set();
                
                for (const job of parsedJobs) {
                    const key = `${job.title}-${job.company}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueJobs.push(job);
                    }
                }
                
                return uniqueJobs;
            } catch (pErr) {
                console.error(`JSON Parse failed for model ${modelName}:`, pErr.message);
                continue; 
            }
        } catch (err) {
            console.error(`AI Job Generation failed with model ${modelName}:`, err.message);
            lastError = err;
            if (err.status === 429) {
                console.log(`Groq rate limit hit for ${modelName}. Trying next model...`);
                // Only sleep if it's the very last model
                if (modelName === models[models.length - 1]) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                continue;
            }
            continue;
        }
    }
    return [];
}

router.get('/search', async (req, res) => {
    try {
        const { q, l, page } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const pageNum = parseInt(page) || 1;
        const jobs = await generateJobsWithAI(q, l, pageNum);
        
        res.json({ 
            jobs,
            currentPage: pageNum,
            hasMore: jobs.length >= 10 // Simulating more results if we got a full-ish set
        });
    } catch (error) {
        console.error('Job Search Failure:', error);
        res.status(500).json({ jobs: [], currentPage: 1, hasMore: false });
    }
});

module.exports = router;
