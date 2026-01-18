require('dotenv').config();
const axios = require('axios');

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ No GEMINI_API_KEY found in .env");
            return;
        }
        
        console.log(`Checking models via REST API with key ending in: ${apiKey.slice(-4)}`);
        
        // Use the same endpoint format that the library uses, but for listModels
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const response = await axios.get(url);
        
        if (response.data && response.data.models) {
            console.log("\n✅ Available Models:");
            const generateModels = response.data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
            
            generateModels.forEach(model => {
                console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
            });
            
            if (generateModels.length === 0) {
                 console.log("No models found that support 'generateContent'.");
            }
        } else {
            console.log("Unexpected response format:", response.data);
        }

    } catch (error) {
        console.error("❌ Failed to list models:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
}

listModels();
