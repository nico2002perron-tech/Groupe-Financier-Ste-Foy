// api/analyze-news.js - EXACTEMENT 3 articles par secteur + SANS TICKERS
export default async function handler(req, res) {
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

        const RSS_SOURCES = {
            all: [
                { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' },
                { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC Markets' },
                { url: 'https://www.marketwatch.com/rss/topstories', name: 'MarketWatch' },
                { url: 'https://www.lapresse.ca/affaires/rss', name: 'La Presse Affaires' },
                { url: 'https://www.lesaffaires.com/rss/manchettes.xml', name: 'Les Affaires' }
            ],
            finance: [
                { url: 'https://www.lesaffaires.com/rss/bourse.xml', name: 'Les Affaires Bourse' },
                { url: 'https://www.lapresse.ca/affaires/rss', name: 'La Presse Affaires' },
                { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' },
                { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', name: 'CNBC Finance' }
            ],
            tech: [
                { url: 'https://www.lapresse.ca/techno/rss', name: 'La Presse Techno' },
                { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch' },
                { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
                { url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html', name: 'CNBC Tech' }
            ],
            crypto: [
                { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
                { url: 'https://cointelegraph.com/rss', name: 'Cointelegraph' },
                { url: 'https://www.lesaffaires.com/rss/manchettes.xml', name: 'Les Affaires' }
            ],
            health: [
                { url: 'https://www.lapresse.ca/actualites/sante/rss', name: 'La Presse Santé' },
                { url: 'https://ici.radio-canada.ca/rss/73', name: 'Radio-Canada Santé' },
                { url: 'https://www.cnbc.com/id/10000108/device/rss/rss.html', name: 'CNBC Health' }
            ],
            energy: [
                { url: 'https://www.lesaffaires.com/rss/energie.xml', name: 'Les Affaires Énergie' },
                { url: 'https://www.cnbc.com/id/19836768/device/rss/rss.html', name: 'CNBC Energy' },
                { url: 'https://www.marketwatch.com/rss/topstories', name: 'MarketWatch' }
            ],
            industrial: [
                { url: 'https://www.lesaffaires.com/rss/manchettes.xml', name: 'Les Affaires' },
                { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' },
                { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC' }
            ],
            defensive: [
                { url: 'https://www.lesaffaires.com/rss/manchettes.xml', name: 'Les Affaires' },
                { url: 'https://www.marketwatch.com/rss/realtimeheadlines', name: 'MarketWatch' },
                { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC' }
            ]
        };

        const sectorNames = {
            all: 'économie mondiale', health: 'santé', tech: 'technologie',
            crypto: 'crypto', industrial: 'industriel', energy: 'énergie',
            finance: 'finance', defensive: 'défensif'
        };

        const sectorName = sectorNames[sector] || sectorNames.all;
        const sources = RSS_SOURCES[sector] || RSS_SOURCES.all;

        console.log(`📰 Fetching from ${sources.length} sources for ${sectorName}`);

        const fetchPromises = sources.map(source => fetchRSS(source));
        const results = await Promise.allSettled(fetchPromises);

        const allArticles = results
            .filter(r => r.status === 'fulfilled' && r.value.length > 0)
            .flatMap(r => r.value);

        console.log(`✅ Fetched ${allArticles.length} total articles`);

        if (allArticles.length === 0) {
            return res.status(200).json({
                success: true,
                articles: [],
                message: 'Aucune nouvelle disponible'
            });
        }

        const now = Date.now();
        const maxAgeMs = 48 * 60 * 60 * 1000;

        const recentArticles = allArticles
            .filter(article => {
                const age = now - new Date(article.pubDate).getTime();
                return age <= maxAgeMs && age >= 0;
            })
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 20);

        console.log(`🔍 ${recentArticles.length} articles récents`);

        if (recentArticles.length === 0) {
            return res.status(200).json({
                success: true,
                articles: [],
                message: 'Aucune nouvelle des dernières 48h'
            });
        }

        // PROMPT pour garantir exactement 3 articles
        const prompt = `Tu es un analyste financier.

DATE: ${new Date().toLocaleDateString('fr-FR')}

Tu as ${recentArticles.length} articles sur "${sectorName}".

ARTICLES:
${recentArticles.map((a, i) => `[${i}] ${a.title}
${a.description}
Source: ${a.source}`).join('\n\n')}

MISSION:
Sélectionne EXACTEMENT 3 articles PERTINENTS pour "${sectorName}".

CRITÈRES (par ordre de priorité):
1. Pertinence pour "${sectorName}"
2. Impact économique ou boursier
3. Entreprises connues (Apple, Tesla, Microsoft, etc.)
4. Nouvelles récentes et importantes

Pour chaque article:
- **title**: Traduit en français, factuel (max 100 car.)
- **summary**: Résumé NEUTRE en français (max 150 car.) - ZÉRO opinion, que des faits
- **importance**: Score 1-10

IMPORTANT: Tu dois sélectionner EXACTEMENT 3 articles. Ni plus ni moins.

Réponds en JSON pur:
{
  "articles": [
    {
      "originalIndex": 0,
      "title": "titre français",
      "summary": "résumé neutre",
      "importance": 8
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
                        content: 'Tu es un analyste financier neutre. Tu réponds en JSON pur. Tu sélectionnes TOUJOURS exactement 3 articles.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.15,
                max_tokens: 1500
            })
        });

        if (!groqResponse.ok) {
            console.error('❌ Groq Error');

            // FALLBACK: Exactement 3 articles
            const fallbackArticles = padTo3(recentArticles.slice(0, 3).map(a => ({
                title: a.title,
                summary: a.description.substring(0, 150),
                source: a.source,
                link: a.link,
                pubDate: a.pubDate,
                time: getTimeAgo(a.pubDate),
                isNew: isPublishedToday(a.pubDate)
            })), recentArticles);

            return res.status(200).json({
                success: true,
                articles: fallbackArticles,
                fallback: true
            });
        }

        const groqData = await groqResponse.json();
        const content = groqData.choices[0].message.content;

        let analyzed;
        try {
            let cleaned = content.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/^[^{]*({.*})[^}]*$/s, '$1');

            analyzed = JSON.parse(cleaned);
        } catch (e) {
            console.error('❌ Parse Error');

            const fallbackArticles = padTo3(recentArticles.slice(0, 3).map(a => ({
                title: a.title,
                summary: a.description.substring(0, 150),
                source: a.source,
                link: a.link,
                pubDate: a.pubDate,
                time: getTimeAgo(a.pubDate),
                isNew: isPublishedToday(a.pubDate)
            })), recentArticles);

            return res.status(200).json({
                success: true,
                articles: fallbackArticles,
                fallback: true
            });
        }

        // ASSEMBLER: EXACTEMENT 3 ARTICLES, SANS TICKERS
        let finalArticles = (analyzed.articles || [])
            .sort((a, b) => (b.importance || 5) - (a.importance || 5))
            .slice(0, 3)
            .map(a => {
                const original = recentArticles[a.originalIndex];
                if (!original) return null;

                return {
                    title: a.title || original.title,
                    summary: a.summary || original.description.substring(0, 150),
                    source: original.source,
                    link: original.link,
                    pubDate: original.pubDate,
                    time: getTimeAgo(original.pubDate),
                    isNew: isPublishedToday(original.pubDate)
                };
            })
            .filter(a => a !== null);

        // GARANTIR EXACTEMENT 3 ARTICLES
        finalArticles = padTo3(finalArticles, recentArticles);

        return res.status(200).json({
            success: true,
            articles: finalArticles,
            sector: sectorName
        });

    } catch (error) {
        console.error('💥 Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Compléter pour atteindre exactement 3 articles
function padTo3(articles, allRecent) {
    if (articles.length >= 3) return articles.slice(0, 3);

    const usedLinks = new Set(articles.map(a => a.link));
    for (const raw of allRecent) {
        if (articles.length >= 3) break;
        if (usedLinks.has(raw.link)) continue;
        articles.push({
            title: raw.title,
            summary: raw.description.substring(0, 150),
            source: raw.source,
            link: raw.link,
            pubDate: raw.pubDate,
            time: getTimeAgo(raw.pubDate),
            isNew: isPublishedToday(raw.pubDate)
        });
        usedLinks.add(raw.link);
    }
    return articles;
}

function isPublishedToday(pubDate) {
    const today = new Date();
    const articleDate = new Date(pubDate);
    return today.toDateString() === articleDate.toDateString();
}

async function fetchRSS(source) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/rss+xml, application/xml'
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) return [];

        const text = await response.text();
        return parseRSS(text, source.name);

    } catch (error) {
        return [];
    }
}

function parseRSS(xmlText, sourceName) {
    const articles = [];
    try {
        const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
        const items = xmlText.match(itemRegex) || [];

        items.forEach((item, i) => {
            if (i >= 15) return;

            const extract = (field) => {
                const cdata = new RegExp(`<${field}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${field}>`, 's');
                const normal = new RegExp(`<${field}[^>]*>(.*?)</${field}>`, 's');
                return (item.match(cdata)?.[1] || item.match(normal)?.[1] || '').trim();
            };

            const title = extract('title');
            const description = extract('description').replace(/<[^>]*>/g, '');
            const link = extract('link');
            const pubDate = extract('pubDate') || new Date().toISOString();

            if (title && link && link.startsWith('http')) {
                articles.push({
                    title: cleanText(title),
                    description: cleanText(description).substring(0, 400),
                    link,
                    pubDate,
                    source: sourceName
                });
            }
        });
    } catch (e) { }

    return articles;
}

function cleanText(text) {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function getTimeAgo(pubDate) {
    const diffMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
}
