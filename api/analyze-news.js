// api/analyze-news.js - VERSION GROQ TOUT-EN-UN
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

        // Mapper les secteurs vers des requêtes de recherche
        const sectorQueries = {
            all: 'actualités financières marchés boursiers économie',
            health: 'santé pharmaceutique biotech dispositifs médicaux',
            tech: 'technologie intelligence artificielle semiconducteurs logiciel',
            crypto: 'cryptomonnaie bitcoin ethereum blockchain',
            industrial: 'industriel manufacturier construction équipement',
            energy: 'énergie pétrole gaz renouvelable',
            finance: 'banque finance investissement assurance',
            defensive: 'biens consommation services publics alimentation'
        };

        const searchQuery = sectorQueries[sector] || sectorQueries.all;
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

        // Symboles boursiers par secteur
        const sectorTickers = {
            all: ['SPY', 'QQQ', 'DIA'],
            health: ['XLV', 'JNJ', 'PFE'],
            tech: ['QQQ', 'AAPL', 'NVDA'],
            crypto: ['BTC-USD', 'ETH-USD'],
            industrial: ['XLI', 'CAT'],
            energy: ['XLE', 'XOM'],
            finance: ['XLF', 'JPM'],
            defensive: ['XLP', 'PG']
        };

        const tickers = (sectorTickers[sector] || sectorTickers.all).slice(0, 2);

        const prompt = `Tu es un analyste financier expert. La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR')}.

TÂCHE: Trouve 5 nouvelles financières RÉCENTES (dernières 48 heures) sur le secteur "${sectorName}".

CRITÈRES STRICTS:
1. Nouvelles des dernières 48h UNIQUEMENT
2. Sources FIABLES: Bloomberg, Reuters, Financial Times, Wall Street Journal, CNBC, Les Affaires, La Presse
3. Pertinentes pour le secteur "${sectorName}"
4. Avec impact boursier potentiel

Pour CHAQUE nouvelle, fournis:
- title: Titre traduit en français (factuel, max 100 caractères)
- summary: Résumé NEUTRE en 1 phrase (max 150 caractères) - AUCUNE opinion, juste les faits
- source: Nom de la source (Bloomberg, Reuters, etc.)
- time: Temps écoulé (ex: "2h", "30min", "1j")
- link: URL de l'article (si disponible, sinon URL de la source)
- tickers: 2 symboles boursiers pertinents parmi: ${tickers.join(', ')}

RÈGLES ABSOLUES:
- Ton 100% NEUTRE et FACTUEL
- Pas d'opinion, de prédiction ou de conseil
- Juste rapporter les faits
- Nouvelles vérifiables et récentes

Réponds UNIQUEMENT en JSON valide (pas de markdown):
{
  "articles": [
    {
      "title": "titre court en français",
      "summary": "résumé neutre factuel",
      "source": "Bloomberg",
      "time": "2h",
      "link": "https://...",
      "tickers": ["SPY", "QQQ"]
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
                        content: 'Tu es un analyste financier neutre et factuel. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni commentaire.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 3000
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

        // Ajouter les variations boursières réelles via Yahoo Finance
        const articlesWithTickers = await Promise.all(
            analyzed.articles.map(async (article) => {
                const tickerData = await Promise.all(
                    article.tickers.map(symbol => getYahooQuote(symbol))
                );

                return {
                    ...article,
                    pubDate: estimatePubDate(article.time),
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

// Estimer la date de publication depuis le temps écoulé
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
