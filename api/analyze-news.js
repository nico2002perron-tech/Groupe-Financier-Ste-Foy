// api/analyze-news.js - VERSION AVEC WEB SEARCH
export default async function handler(req, res) {
    // CORS
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
        const { sector } = req.body;

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Mapper les secteurs
        const sectorQueries = {
            all: 'actualités financières marchés boursiers',
            health: 'actualités santé pharmaceutique biotech',
            tech: 'actualités technologie IA semiconducteurs',
            crypto: 'actualités cryptomonnaie bitcoin ethereum',
            industrial: 'actualités industriel manufacturier',
            energy: 'actualités énergie pétrole',
            finance: 'actualités banque finance',
            defensive: 'actualités biens consommation'
        };

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

        const sectorTickers = {
            all: ['SPY', 'QQQ'],
            health: ['XLV', 'JNJ'],
            tech: ['QQQ', 'NVDA'],
            crypto: ['BTC-USD', 'ETH-USD'],
            industrial: ['XLI', 'CAT'],
            energy: ['XLE', 'XOM'],
            finance: ['XLF', 'JPM'],
            defensive: ['XLP', 'PG']
        };

        const tickers = (sectorTickers[sector] || sectorTickers.all);
        const searchQuery = sectorQueries[sector] || sectorQueries.all;

        const prompt = `Tu es un analyste financier expert. Date: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

TÂCHE: Trouve 5 nouvelles financières RÉELLES et RÉCENTES (dernières 48 heures) sur "${sectorName}".

UTILISE LA RECHERCHE WEB pour trouver de VRAIES nouvelles actuelles.

SOURCES FIABLES UNIQUEMENT: Bloomberg, Reuters, Financial Times, Wall Street Journal, CNBC, MarketWatch, Les Affaires, La Presse.

Pour CHAQUE nouvelle, fournis:
- title: Titre exact traduit en français (max 120 caractères)
- summary: Résumé NEUTRE et FACTUEL en 1 phrase (max 150 caractères) - ZÉRO opinion
- source: Nom exact de la source (ex: "Bloomberg", "Reuters")
- time: Temps écoulé réel (ex: "2h", "5h", "1j")
- link: URL RÉELLE de l'article
- tickers: 2 symboles boursiers pertinents parmi: ${tickers.join(', ')}

RÈGLES CRITIQUES:
- URLs RÉELLES qui existent vraiment
- Dates et heures EXACTES et ACTUELLES
- Ton 100% NEUTRE - rapporte juste les faits
- Prix et chiffres EXACTS (pas d'invention!)

Réponds en JSON pur (pas de markdown):
{
  "articles": [
    {
      "title": "titre exact",
      "summary": "résumé factuel",
      "source": "Bloomberg",
      "time": "3h",
      "link": "https://www.bloomberg.com/...",
      "tickers": ["SPY", "QQQ"]
    }
  ]
}`;

        // APPEL AVEC WEB SEARCH ACTIVÉ
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
                        content: 'Tu es un analyste financier qui utilise la recherche web pour trouver des nouvelles actuelles. Tu réponds en JSON pur sans markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 3000,
                // ✨ ACTIVATION DU WEB SEARCH
                tools: [
                    {
                        type: "web_search_20250305",
                        name: "web_search"
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API Error:', error);
            return res.status(500).json({ error: 'Groq API error', details: error });
        }

        const data = await response.json();

        // Gérer les réponses avec tool_use
        let content = '';
        if (data.choices[0].message.content) {
            content = data.choices[0].message.content;
        } else if (data.choices[0].message.tool_calls) {
            // Si Groq a utilisé web search, la réponse peut être dans tool_calls
            console.log('Tool calls detected:', data.choices[0].message.tool_calls);
            // On prend le dernier message qui contient généralement le résultat final
            content = data.choices[0].message.tool_calls[data.choices[0].message.tool_calls.length - 1]?.function?.arguments || '{"articles":[]}';
        }

        let analyzed;
        try {
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            if (start === -1 || end === -1) throw new Error('No JSON object found in response');

            const jsonStr = content.substring(start, end + 1);
            analyzed = JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON Parse Error:', content);
            return res.status(500).json({
                error: 'Invalid JSON from Groq',
                message: e.message,
                contentPreview: content.substring(0, 300)
            });
        }

        if (!analyzed.articles || analyzed.articles.length === 0) {
            return res.status(200).json({
                success: true,
                articles: [],
                sector: sectorName,
                message: 'Aucune nouvelle trouvée'
            });
        }

        // Ajouter les variations boursières réelles
        const articlesWithTickers = await Promise.all(
            analyzed.articles.slice(0, 5).map(async (article) => {
                const tickerData = await Promise.all(
                    (article.tickers || tickers.slice(0, 2)).map(symbol => getYahooQuote(symbol))
                );

                return {
                    title: article.title,
                    summary: article.summary,
                    source: article.source,
                    time: article.time || '1h',
                    link: article.link || '#',
                    pubDate: estimatePubDate(article.time || '1h'),
                    tickers: tickerData.filter(t => t !== null)
                };
            })
        );

        return res.status(200).json({
            success: true,
            articles: articlesWithTickers,
            sector: sectorName,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Obtenir quote Yahoo Finance
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

        if (!price || !prevClose) return null;

        const change = ((price - prevClose) / prevClose * 100);

        return {
            symbol: symbol,
            change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
            isUp: change > 0,
            starred: Math.abs(change) > 2
        };

    } catch (error) {
        return null;
    }
}

// Estimer la date de publication
function estimatePubDate(timeStr) {
    const now = new Date();

    if (timeStr.includes('min')) {
        const mins = parseInt(timeStr);
        return new Date(now - mins * 60 * 1000).toISOString();
    }

    if (timeStr.includes('h')) {
        const hours = parseInt(timeStr);
        return new Date(now - hours * 60 * 60 * 1000).toISOString();
    }

    if (timeStr.includes('j')) {
        const days = parseInt(timeStr);
        return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    }

    return now.toISOString();
}
