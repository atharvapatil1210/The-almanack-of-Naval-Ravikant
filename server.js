const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini API with the correct configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
    apiVersion: 'v1beta'
});

// Naval's context for the AI
const navalContext = `
    You are Naval Ravikant, a tech entrepreneur, investor, and modern philosopher known for your concise, 
    profound wisdom on wealth creation, happiness, and living a meaningful life. Respond as Naval would - 
    in a clear, direct, and thoughtful manner.

    Key principles of Naval's thinking:
    - Wealth is assets that earn while you sleep. Focus on specific knowledge, accountability, leverage, and judgment.
    - Happiness is a choice and a skill, not something to be pursued externally.
    - Read what you love until you love to read. Books are the backup brain of civilization.
    - Learn to learn. The fundamentals in math, science, and philosophy are more important than specific skills.
    - Play long-term games with long-term people. All returns in life come from compound interest.
    - Meditation and mental clarity are the foundation of a good life.
    - Seek truth above social approval.
    - Speak directly and authentically. Avoid jargon and unnecessary complexity.
    - "The purpose of life is to learn, the purpose of learning is to understand yourself, and understanding yourself leads to salvation."

    Answer as Naval would, with clarity, wisdom, and direct honesty. Keep responses concise but profound.
`;

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Received message:', message);
        console.log('Conversation history:', conversationHistory);
        
        // Initialize the model with the correct name
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.0-pro",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });
        
        // Prepare the chat
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: navalContext }]
                },
                ...conversationHistory
            ],
        });

        // Generate response
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        console.log('Generated response:', text);

        res.json({ response: text });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            message: error.message,
            fallback: getRandomFallbackResponse()
        });
    }
});

// Fallback responses
const fallbackResponses = [
    "Specific knowledge is knowledge you cannot be trained for. If society can train you, it can train someone else and replace you.",
    "Earn with your mind, not your time. The most important skill for getting rich is becoming a perpetual learner.",
    "Happiness is a choice you make and a skill you develop. It's the absence of desire, especially the absence of desire for external things.",
    "The purpose of meditation is to learn to see the thoughts as thoughts and not get so caught up and identified with them.",
    "All the real benefits in life come from compound interest.",
    "Read what you love until you love to read. Reading is faster than listening, doing is faster than watching.",
    "Learn to sell, learn to build. If you can do both, you'll be unstoppable.",
    "The moment you tell somebody that something is wrong with them, you've lost your ability to influence them.",
    "If you're not spending your time doing what you want, and you're not earning, and you're not learning, what the heck are you doing?",
    "In a long-term game, the returns are in the compound interest."
];

function getRandomFallbackResponse() {
    const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
    return fallbackResponses[randomIndex];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
}); 