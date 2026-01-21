const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// In-memory session storage (MVP)
// In a production app, use Redis or MongoDB for session persistence
const interviewSessions = new Map();

// Helper to interact with AI
async function getAIResponse(messages) {
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    for (const model of models) {
        try {
            const completion = await groq.chat.completions.create({
                messages,
                model,
                temperature: 0.7,
            });
            return completion.choices[0]?.message?.content || "";
        } catch (err) {
            console.error(`Groq error with ${model}:`, err.message);
            if (model === models[models.length - 1]) throw err;
        }
    }
}

// 1. Start Interview
router.post('/start', auth, async (req, res) => {
    try {
        const { jobTitle, company, notes, language, userProfile, level, type } = req.body;
        const sessionId = crypto.randomUUID();

        const systemPrompt = `
            You are a professional hiring manager for ${company}. 
            You are interviewing a candidate for the ${jobTitle} position (${level || 'Mid-level'}).
            Interview Type: ${type || 'Mixed'}.
            Target Language: ${language || 'English'}.

            CONTEXT:
            - Job Details: ${notes || 'Standard ' + jobTitle + ' role'}
            - Candidate Profile: ${userProfile || 'No profile provided (assume general candidate)'}

            RULES:
            1. Ask exactly ONE question at a time.
            2. Do NOT provide answers or long explanations.
            3. Start with a brief professional greeting and the first question.
            4. Stay in character. Be professional and slightly challenging but fair.
            5. Respond in ${language || 'English'}.
        `;

        const initialMessages = [{ role: 'system', content: systemPrompt }];
        const firstQuestion = await getAIResponse(initialMessages);

        interviewSessions.set(sessionId, {
            messages: [...initialMessages, { role: 'assistant', content: firstQuestion }],
            jobContext: { jobTitle, company, language },
            startTime: Date.now()
        });

        res.json({ sessionId, question: firstQuestion });
    } catch (error) {
        console.error('Interview start error:', error);
        res.status(500).json({ message: 'Failed to start interview' });
    }
});

// 2. Chat / Message
router.post('/message', auth, async (req, res) => {
    try {
        const { sessionId, userAnswer } = req.body;
        const session = interviewSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session expired or not found' });
        }

        // Add user answer to history
        session.messages.push({ role: 'user', content: userAnswer });

        // Build prompt for feedback + next question
        // We inject instructions as a system hint to guide the next response
        const instructions = {
            role: 'system',
            content: `
                The candidate just answered your previous question.
                1. Provide a VERY BRIEF evaluation of their answer (e.g., "Good point on X, but be careful with Y").
                2. Ask the NEXT interview question.
                3. Ask exactly ONE question.
                4. Maintain the professional interviewer persona.
            `
        };

        // Keep tokens low: system prompt + last 5-10 messages
        const historyContext = [
            session.messages[0], // System prompt
            ...session.messages.slice(-8) // Last interactions
        ];

        const nextMessage = await getAIResponse([...historyContext, instructions]);
        
        // Save assistant response to history
        session.messages.push({ role: 'assistant', content: nextMessage });
        
        res.json({ response: nextMessage });
    } catch (error) {
        console.error('Interview message error:', error);
        res.status(500).json({ message: 'Failed to process response' });
    }
});

// 3. End Interview & Get Feedback
router.post('/end', auth, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = interviewSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const summaryPrompt = `
            The interview for ${session.jobContext.jobTitle} at ${session.jobContext.company} is over.
            Based on the full conversation history, provide a structured performance report.
            
            Sections:
            1. Strengths: 3 key bullet points.
            2. Areas for Improvement: 3 key bullet points.
            3. Overall Score: 0-100.
            4. Hiring Recommendation: (Strong Hire / Hire / No Hire).
            5. Key Takeaway: A 2-sentence final advice.

            Response must be in ${session.jobContext.language || 'English'}.
        `;

        const report = await getAIResponse([
            ...session.messages,
            { role: 'system', content: summaryPrompt }
        ]);

        // Cleanup session
        interviewSessions.delete(sessionId);

        res.json({ report });
    } catch (error) {
        console.error('Interview end error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
});

module.exports = router;
