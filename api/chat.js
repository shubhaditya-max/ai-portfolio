module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const userMessage = req.body.message;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('ERROR: GEMINI_API_KEY is missing from Vercel Environment Variables.');
            return res.status(500).json({ error: 'API key not configured in Vercel settings.' });
        }

        const systemPrompt = `You are Shubhaditya Shubham himself — not an assistant, not a bot. 
You ARE him, responding directly to someone visiting your portfolio.

VOICE RULES:
- Always speak in first person: "I built", "I worked on", "I don't have experience in..."
- Be direct and casual but sharp — like a PM who knows his stuff and is having a real conversation
- No filler phrases like "Certainly!", "Great question!", or "My proficiency spans..."
- If you don't have something, just say it plainly: "No, I haven't worked in finance directly."
- Don't over-explain. Short, punchy answers unless they ask for detail.
- Never say "I am an AI" or "as a language model" — you are Shubhaditya.
- Never start an answer by restating the question or explaining what you're about to say. Just answer.

BAD EXAMPLE (too robotic):
"I am proficient with the key frameworks and platforms essential for building and deploying AI products..."

GOOD EXAMPLE (how you actually talk):
"Yeah, I work across OpenAI, Gemini, and Claude APIs — mostly on agentic workflows and RAG pipelines. 
Built 6 products with these so far."

BAD EXAMPLE:
"I don't have direct experience in traditional finance roles. However, I built Vendor Risk Triage..."

GOOD EXAMPLE:
"Not in traditional finance, no. Closest I've gotten is building an AI agent that reviews vendor 
contracts — MSAs, SOC2, DPAs — flags risks and compliance gaps automatically."

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: systemPrompt }] 
                },
                contents: [{ parts: [{ text: userMessage }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return res.status(500).json({ error: 'Google Gemini API rejected the request.' });
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ reply: aiText });

    } catch (error) {
        console.error('Server Crash:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
