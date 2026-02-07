// api/analyze-news.js - VERSION GROQ TOUT-EN-UN
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

        const sectorName = {
            all: 'tous les secteurs',
            health: 'santé',
            tech: 'technologie',
            crypto: 'crypto',
            industrial: 'industriel',
            energy: 'énergie',
            finance: 'finance',
            defensive: 'défensif'
        }[sector] || 'tous les secteurs';

        // Sélectionner les tickers pour l'enrichissement
        const sectorTickers = {
            all: ['SPY', 'QQQ'],
            health: ['XLV', 'JNJ'],
            tech: ['QQQ', 'NVDA'],
            crypto: ['BTC-USD', 'ETH-USD'],
            energy: ['XLE', 'XOM'],
            finance: ['XLF', 'JPM']
        };
        const tickers = sectorTickers[sector] || sectorTickers.all;

        const prompt = `Tu es un analyste financier expert. 
Analyse ces ${articles.length} articles récents sur le secteur "${sectorName}".

CONTEXTE:
${articles.map((a, i) => `
ID: ${i}
Titre: ${a.title}
Source: ${a.source}
Résumé brut: ${a.summary}
`).join('\n')}

TÂCHES:
1. Filtre les articles pour ne garder que les plus IMPORTANTS et PERTINENTS pour "${sectorName}".
2. Traduis les titres en français s'ils sont en anglais.
3. Pour chaque article retenu, crée un résumé NEUTRE et FACTUEL en une seule phrase courte (max 150 car.).
4. Garde MAXIMUM 5 articles.

RÈGLES DE RÉPONSE (JSON UNIQUEMENT):
Réponds strictement avec cet objet JSON:
{
  "articles": [
    {
      "originalIndex": ID_NUMÉRIQUE,
      "title": "titre en français",
      "summary": "résumé neutre factuel",
      "relevant": true,
      "importance": 1-10
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
                    { role: 'system', content: 'Tu es un analyste financier neutre. Tu ne fournis QUE du JSON sans texte avant ou après.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let analyzed;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analyzed = JSON.parse(cleaned);
        } catch (e) {
            throw new Error('Invalid JSON from Groq');
        }

        // Enrichir avec les données originales et ajouter les tickers
        const processedArticles = await Promise.all(
            analyzed.articles
                .filter(a => a.relevant)
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 5)
                .map(async a => {
                    const original = articles[a.originalIndex];
                    const tickerQuotes = await Promise.all(tickers.map(s => getYahooQuote(s)));

                    return {
                        title: a.title,
                        summary: a.summary,
                        source: original.source,
                        link: original.link,
                        time: getTimeAgo(original.pubDate),
                        tickers: tickerQuotes.filter(t => t !== null)
                    };
                })
        );

        return res.status(200).json({
            success: true,
            articles: processedArticles,
            sector: sectorName
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

async function getYahooQuote(symbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        const result = data.chart.result[0];
        if (!result) return null;
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose;
        const change = ((price - prevClose) / prevClose * 100);
        return {
            symbol,
            change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
            isUp: change > 0,
            starred: Math.abs(change) > 2
        };
    } catch (e) { return null; }
}

function getTimeAgo(pubDate) {
    const diffMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
}
