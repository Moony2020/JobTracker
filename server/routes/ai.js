const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

            Job Description:
            ${text}

            Return ONLY the JSON object, no markdown or extra text.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();
        
        // Clean up response in case Gemini adds markdown code blocks
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not parse AI response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        res.json(parsedData);
    } catch (error) {
        console.error('AI Parse error:', error);
        res.status(500).json({ message: 'Failed to parse job description with AI' });
    }
});

module.exports = router;
