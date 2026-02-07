export default async function handler(req, res) {
    // CORS - Autoriser toutes les origines (temporaire pour test)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { articles, sector } = req.body;

        if (!articles || !Array.isArray(articles)) {
            return res.status(400).json({ error: 'Invalid articles data' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const prompt = `Tu es un analyste financier expert qui filtre et résume des nouvelles.

Voici ${articles.length} articles bruts sur le secteur "${sector}":

${articles.map((a, i) => `
Article ${i + 1}:
Titre: ${a.title}
Description: ${a.summary}
Source: ${a.source}
`).join('\n')}

TÂCHES:
1. Analyse chaque article
2. ÉLIMINE les articles non-pertinents pour le secteur "${sector}"
3. ÉLIMINE les articles trop vieux ou non-financiers
4. Pour les articles pertinents, crée un résumé NEUTRE en 1 phrase (max 150 caractères)
5. Garde MAXIMUM 5 meilleurs articles

RÈGLES STRICTES:
- Ton NEUTRE et FACTUEL (pas d'opinion)
- Résumés courts et informatifs
- Priorité aux nouvelles récentes et importantes

Réponds UNIQUEMENT en JSON (pas de markdown):
{
  "articles": [
    {
      "originalIndex": 0,
      "title": "titre traduit si nécessaire",
      "summary": "résumé neutre en 1 phrase",
      "relevant": true,
      "importance": 8
    }
  ]
}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un analyste financier expert. Tu réponds UNIQUEMENT en JSON valide, sans markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API Error:', error);
            return res.status(500).json({ error: 'Groq API error', details: error });
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let analyzed;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analyzed = JSON.parse(cleaned);
        } catch (e) {
            console.error('JSON Parse Error:', content);
            return res.status(500).json({ error: 'Invalid JSON from Groq', content });
        }

        const processedArticles = analyzed.articles
            .filter(a => a.relevant)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5)
            .map(a => {
                const original = articles[a.originalIndex];
                return {
                    ...original,
                    title: a.title,
                    summary: a.summary,
                    importance: a.importance
                };
            });

        return res.status(200).json({
            success: true,
            articles: processedArticles,
            totalAnalyzed: articles.length,
            keptArticles: processedArticles.length
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
