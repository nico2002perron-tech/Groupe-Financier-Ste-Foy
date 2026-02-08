// api/analyze-news.js - RSS CÔTÉ SERVEUR + GROQ RÉSUME
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

        // Sources RSS fiables
        const RSS_FEEDS = {
            all: [
                'https://www.lapresse.ca/rss',
                'https://www.lesaffaires.com/rss/manchettes.xml'
            ],
            finance: [
                'https://www.lesaffaires.com/rss/bourse.xml',
                'https://www.lapresse.ca/affaires/rss'
            ],
            tech: [
                'https://www.lapresse.ca/techno/rss'
            ],
            health: [
                'https://www.lapresse.ca/actualites/sante/rss'
            ],
            energy: [
                'https://www.lesaffaires.com/rss/energie.xml'
            ],
            crypto: [
                'https://www.lesaffaires.com/rss/manchettes.xml'
            ],
            industrial: [
                'https://www.lesaffaires.com/rss/manchettes.xml'
            ],
            defensive: [
                'https://www.lesaffaires.com/rss/manchettes.xml'
            ]
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

        const tickers = sectorTickers[sector] || sectorTickers.all;
        const feeds = RSS_FEEDS[sector] || RSS_FEEDS.all;

        // 1. CHARGER LES RSS CÔTÉ SERVEUR (pas de CORS!)
        console.log('Fetching RSS feeds for sector:', sector);
        const allArticles = [];

        for (const feedUrl of feeds) {
            try {
                const rssResponse = await fetch(feedUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; GroqNewsBot/1.0)'
                    }
                });

                if (!rssResponse.ok) {
                    console.log(`RSS fetch failed for ${feedUrl}:`, rssResponse.status);
                    continue;
                }

                const rssText = await rssResponse.text();
                const articles = parseRSS(rssText, feedUrl);
                allArticles.push(...articles);

            } catch (error) {
                console.error(`Error fetching ${feedUrl}:`, error.message);
            }
        }

        console.log('Total articles fetched:', allArticles.length);

        if (allArticles.length === 0) {
            return res.status(200).json({
                success: true,
                articles: [],
                message: 'Aucune nouvelle disponible pour ce secteur'
            });
        }

        // 2. Filtrer les articles récents (48h max)
        const recentArticles = allArticles.filter(article => {
            const ageInHours = (Date.now() - new Date(article.pubDate)) / (1000 * 60 * 60);
            return ageInHours <= 48;
        }).slice(0, 10); // Top 10

        if (recentArticles.length === 0) {
            return res.status(200).json({
                success: true,
                articles: [],
                message: 'Aucune nouvelle récente (48h) disponible'
            });
        }

        // 3. GROQ ANALYSE ET RÉSUME
        const prompt = `Tu es un analyste financier expert. Voici ${recentArticles.length} articles récents sur "${sectorName}".

ARTICLES:
${recentArticles.map((a, i) => `
${i + 1}. ${a.title}
   ${a.description}
   Source: ${a.source}
`).join('\n')}

TÂCHE:
1. Sélectionne les 5 articles les PLUS PERTINENTS pour "${sectorName}"
2. Pour chaque article sélectionné, crée un résumé NEUTRE en 1 phrase (max 150 caractères)
3. Traduis en français si nécessaire
4. Attribue 2 symboles boursiers pertinents parmi: ${tickers.join(', ')}

RÈGLES:
- Ton 100% NEUTRE et FACTUEL
- Pas d'opinion ni de prédiction
- Résumés courts et informatifs

Réponds en JSON pur (pas de markdown):
{
  "articles": [
    {
      "originalIndex": 0,
      "title": "titre traduit",
      "summary": "résumé neutre",
      "relevant": true,
      "tickers": ["SPY", "QQQ"]
    }
  ]
}`;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                        content: 'Tu es un analyste financier neutre. Tu réponds en JSON pur sans markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 2000
            })
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('Groq API Error:', errorText);

            // FALLBACK: Retourner les articles bruts
            return res.status(200).json({
                success: true,
                articles: recentArticles.slice(0, 5).map(a => ({
                    ...a,
                    time: getTimeAgo(a.pubDate),
                    tickers: []
                })),
                fallback: true
            });
        }

        const groqData = await groqResponse.json();
        const content = groqData.choices[0].message.content;

        let analyzed;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analyzed = JSON.parse(cleaned);
        } catch (e) {
            console.error('JSON Parse Error:', content);
            // FALLBACK
            return res.status(200).json({
                success: true,
                articles: recentArticles.slice(0, 5).map(a => ({
                    ...a,
                    time: getTimeAgo(a.pubDate),
                    tickers: []
                })),
                fallback: true
            });
        }

        // 4. Combiner avec données originales + variations boursières
        const finalArticles = await Promise.all(
            analyzed.articles
                .filter(a => a.relevant)
                .slice(0, 5)
                .map(async (a) => {
                    const original = recentArticles[a.originalIndex];

                    const tickerData = await Promise.all(
                        (a.tickers || tickers.slice(0, 2)).map(symbol => getYahooQuote(symbol))
                    );

                    return {
                        title: a.title,
                        summary: a.summary,
                        source: original.source,
                        link: original.link,
                        pubDate: original.pubDate,
                        time: getTimeAgo(original.pubDate),
                        tickers: tickerData.filter(t => t !== null)
                    };
                })
        );

        return res.status(200).json({
            success: true,
            articles: finalArticles,
            sector: sectorName
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Parser RSS simple
function parseRSS(xmlText, feedUrl) {
    const articles = [];
    const sourceName = feedUrl.includes('lapresse') ? 'La Presse' :
        feedUrl.includes('lesaffaires') ? 'Les Affaires' : 'Source';

    // Regex simple pour extraire les items
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const items = xmlText.match(itemRegex) || [];

    items.forEach((item, index) => {
        if (index >= 10) return; // Max 10 par feed

        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
        const linkMatch = item.match(/<link>(.*?)<\/link>/s);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/s);

        const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
        const description = (descMatch?.[1] || descMatch?.[2] || '').replace(/<[^>]*>/g, '').trim();
        const link = (linkMatch?.[1] || '').trim();
        const pubDate = pubDateMatch?.[1] || new Date().toISOString();

        if (title && link) {
            articles.push({
                title,
                description: description.substring(0, 300),
                link,
                pubDate,
                source: sourceName
            });
        }
    });

    return articles;
}

// Variations boursières Yahoo
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

// Temps écoulé
function getTimeAgo(pubDate) {
    const diffMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
}
