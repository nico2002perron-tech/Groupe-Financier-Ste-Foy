// api/analyze-news.js
// Version Diagnostic avec logs et fallback

export default async function handler(req, res) {
    // 2️⃣ LOGS CÔTÉ SERVEUR
    console.log("=== API CALLED ===");
    console.log("Method:", req.method);
    console.log("Body exists:", !!req.body);
    console.log("GROQ KEY exists:", !!process.env.GROQ_API_KEY);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { articles: providedArticles, sector } = req.body;
    let articles = providedArticles || [];
    let aiCalled = false;
    let processedArticles = [];

    try {
        // 5️⃣ Si aucun article n'est fourni, on les cherche nous-mêmes (server-side pour éviter CORS)
        if (articles.length === 0 && sector) {
            console.log("Fetching RSS feeds server-side for sector:", sector);
            articles = await fetchAllRSS(sector);
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (GROQ_API_KEY && articles.length > 0) {
            aiCalled = true;
            try {
                processedArticles = await analyzeWithGroq(articles, sector, GROQ_API_KEY);
            } catch (aiError) {
                console.error("Groq AI Error:", aiError);
                // 4️⃣ IMPORTANT: Fallback aux articles BRUTS si l'IA échoue
                processedArticles = fallbackToRaw(articles);
            }
        } else {
            // Pas de clé ou pas d'articles -> Fallback immédiat
            processedArticles = fallbackToRaw(articles);
        }

        // 4️⃣ Si l'IA retourne vide -> Fallback
        if (processedArticles.length === 0 && articles.length > 0) {
            processedArticles = fallbackToRaw(articles);
        }

        // 3️⃣ RETOURNER DEBUG JSON
        return res.status(200).json({
            success: true,
            articles: processedArticles,
            debug: {
                groqKey: !!GROQ_API_KEY,
                articlesReceived: articles?.length,
                aiCalled: aiCalled,
                fallback: processedArticles.length > 0 && aiCalled === false
            }
        });

    } catch (error) {
        console.error('Server Technical Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            debug: { error: true }
        });
    }
}

// --- LOGIQUE AI ---
async function analyzeWithGroq(articles, sector, apiKey) {
    const prompt = `Analyse ces ${articles.length} articles financiers pour le secteur "${sector}".
Filtre les 5 plus importants, traduis en français, et résume en 1 courte phrase.
RÉPONS STRICTEMENT EN JSON: {"articles": [{"originalIndex": 0, "title": "...", "summary": "...", "importance": 10}]}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'JSON analyst only.' }, { role: 'user', content: prompt }],
            temperature: 0.1
        })
    });

    if (!response.ok) throw new Error('Groq unreachable');

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return await Promise.all(parsed.articles.map(async a => {
        const original = articles[a.originalIndex];
        const tickers = await getTickersForSector(sector);
        return {
            title: a.title,
            summary: a.summary,
            source: original.source,
            link: original.link,
            time: getTimeAgo(original.pubDate),
            tickers: tickers
        };
    }));
}

// --- LOGIQUE DE RÉCUPÉRATION RSS (SERVER-SIDE) ---
async function fetchAllRSS(sector) {
    const FEEDS = {
        all: ['https://www.lapresse.ca/rss', 'https://www.lesaffaires.com/rss/manchettes.xml'],
        finance: ['https://www.lesaffaires.com/rss/bourse.xml']
    };
    const urls = FEEDS[sector] || FEEDS.all;
    const results = await Promise.all(urls.map(url => fetchOneRSS(url)));
    return results.flat();
}

async function fetchOneRSS(url) {
    try {
        const res = await fetch(url);
        const text = await res.text();
        // Parsing minimaliste pour le serveur (Regex car pas de DOMParser natif en Node sans lib)
        const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
        return items.slice(0, 5).map(item => {
            const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
            const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
            const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || new Date().toISOString();
            return { title, link, pubDate, source: "RSS", summary: "Article récent." };
        });
    } catch (e) { return []; }
}

// --- UTILS ---
function fallbackToRaw(articles) {
    return articles.slice(0, 5).map(a => ({
        title: a.title,
        summary: a.summary || "Consultez l'article complet pour plus de détails.",
        source: a.source || "Source externe",
        link: a.link,
        time: getTimeAgo(a.pubDate),
        tickers: []
    }));
}

async function getTickersForSector(sector) {
    const map = { tech: ['QQQ', 'NVDA'], finance: ['XLF', 'JPM'] };
    const symbols = map[sector] || ['SPY', 'QQQ'];
    return Promise.all(symbols.map(async s => {
        try {
            const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=2d`);
            const data = await res.json();
            const meta = data.chart.result[0].meta;
            const change = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100);
            return { symbol: s, change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`, isUp: change > 0 };
        } catch (e) { return null; }
    })).then(t => t.filter(x => x !== null));
}

function getTimeAgo(pubDate) {
    try {
        const diffMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
        if (diffMins < 60) return `${diffMins}min`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return `${Math.floor(diffMins / 1440)}j`;
    } catch (e) { return "Récemment"; }
}
