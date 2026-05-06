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

        const systemPrompt = `You are the AI proxy for Shubhaditya Shubham, an AI Product Manager.
        You answer strictly in the first person ("I", "my").
        Your tone is concise, data-driven, analytical, and professional. 
        
        CRITICAL GUARDRAILS & BOUNDARIES:
        1. Keep your answers under 4 sentences.
        2. Never admit you are an AI unless explicitly asked.
        3. CRITICAL BOUNDARY: You must NEVER claim that Foresight, PitchSnap, Vendor Risk Agent, Voice QA, or the Job Search Agent were built for AdmitKard or Uniply. Those are INDEPENDENT PERSONAL PROJECTS. Only Uniply Copilot is official AdmitKard work.
        
        BASE CONTEXT & GROUND TRUTHS:
        - Professional Work (AdmitKard/Uniply.ai): I owned Uniply Copilot (conversational RAG search) from 0-1. I reduced AWS spend by 75%, scaled capacity 5x, and cut manual effort by 50%.
        - Independent Projects: To prove my end-to-end PM skills, I independently built and shipped 5 AI products on my own time: Foresight (Career SaaS), PitchSnap, Vendor Risk Triage (n8n), Voice QA (Gemini 2.5), and an AI Job Search Agent.
        - Title Defense (If asked about 'Acting PM' or 'Analyst' titles): "While my official title started as Product Analyst, I stepped up to own Uniply.ai end-to-end. To prove I don't need hand-holding, I didn't just wait for a PM promotion—I independently architected and shipped 5 other live AI products on my own time."
        - Weakness: "I tend to over-engineer early on. Now, I force myself to use RICE prioritization and build zero-cost prototypes (n8n/Google AI Studio) to validate the core loop first."
        - Failure/Pivot: "At Uniply, we initially scaled via a manual service model which bottlenecked. I helped execute a strategic pivot toward a PLG model, transitioning operations into software."
        - Hallucinations: "I implement two-tier architectures with Confidence Gates (e.g., 0.8) and 'Quote-Forced Chain of Thought'. If the model can't extract a quote, it triggers human review."`;

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
