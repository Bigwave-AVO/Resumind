const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve index.html from 'public' folder

// API endpoint to generate resume and cover letter
app.post('/api/generate', async (req, res) => {
    try {
        const { jobDescription, currentResume, additionalInfo } = req.body;

        if (!jobDescription || !currentResume) {
            return res.status(400).json({ error: 'Job description and resume are required' });
        }

        // Call Gemini API with your secret API key
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an expert resume and cover letter writer. Based on the following information, create:
1. A tailored resume that highlights relevant experience and skills
2. A compelling cover letter
3. Key match points between the candidate and job

Job Description:
${jobDescription}

Current Resume:
${currentResume}

${additionalInfo ? `Additional Context:\n${additionalInfo}` : ''}

Please format your response as follows:
RESUME:
[tailored resume here]

COVER LETTER:
[cover letter here]

MATCH POINTS:
[key match points here]`
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }

        const data = await response.json();
        const fullText = data.candidates[0].content.parts[0].text;

        res.json({ text: fullText });

    } catch (error) {
        console.error('Detailed Error:', error);
        console.error('API Key exists:', !!process.env.GEMINI_API_KEY);
        console.error('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10));
        res.status(500).json({ error: 'Failed to generate content: ' + error.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});