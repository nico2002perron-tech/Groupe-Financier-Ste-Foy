// api/analyze-news.js - VERSION WEB SEARCH OFFICIELLE
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { sector = 'all' } = req.body;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY missing');

        const sectorNames = { all: 'tous les secteurs', health: 'santé', tech: 'technologie', crypto: 'crypto', industrial: 'industriel', energy: 'énergie', finance: 'finance', defensive: 'défensif' };
        const sectorName = sectorNames[sector] || sectorNames.all;
        const tickers = { all: ['SPY', 'QQQ'], health: ['XLV', 'JNJ'], tech: ['QQQ', 'AAPL'], crypto: ['BTC-USD', 'ETH-USD'], industrial: ['XLI', 'CAT'], energy: ['XLE', 'XOM'], finance: ['XLF', 'JPM'], defensive: ['XLP', 'PG'] }[sector] || ['SPY', 'QQQ'];

        const prompt = `Analyste financier expert. Date: ${new Date().toLocaleDateString('fr-FR')}.
TÂCHE: Trouve 5 nouvelles financières RÉELLES (<48h) sur "${sectorName}".
UTILISE LA RECHERCHE WEB pour des liens RÉELS.
FORMAT: JSON uniquement: {"articles": [{"title": "...", "summary": "...", "source": "Bloomberg", "time": "2h", "link": "https://...", "tickers": ["${tickers[0]}", "${tickers[1]}"]}]}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Tu es un analyste financier utilisant la recherche web. Réponds UNIQUEMENT en JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                tools: [{
                    type: "web_search",
                    name: "web_search"
                }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "";

        // Handling tool-use response pattern
        if (!content && data.choices[0]?.message?.tool_calls) {
            const toolCall = data.choices[0].message.tool_calls.find(t => t.function?.arguments);
            content = toolCall?.function?.arguments || "";
        }

        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start === -1) throw new Error(`No JSON found. Raw: ${content.substring(0, 100)}`);

        const analyzed = JSON.parse(content.substring(start, end + 1));

        const finalArticles = await Promise.all((analyzed.articles || []).slice(0, 5).map(async (art) => {
            const syms = art.tickers || tickers;
            const quoteData = await Promise.all(syms.slice(0, 2).map(s => getYahooQuote(s)));
            return {
                ...art,
                pubDate: estimatePubDate(art.time || '1h'),
                tickers: quoteData.filter(q => q !== null)
            };
        }));

        return res.status(200).json({ success: true, articles: finalArticles, sector: sectorName });

    } catch (error) {
        console.error("FINAL_API_ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "ANALYSIS_FAILED",
            message: error.message
        });
    }
}

async function getYahooQuote(symbol) {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
        if (!res.ok) return null;
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (!meta) return null;
        const chg = ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100);
        return { symbol, change: `${chg > 0 ? '+' : ''}${chg.toFixed(2)}%`, isUp: chg > 0 };
    } catch (e) { return null; }
}

function estimatePubDate(timeStr) {
    const now = new Date();
    const val = parseInt(timeStr) || 1;
    if (timeStr.includes('min')) return new Date(now - val * 60000).toISOString();
    if (timeStr.includes('h')) return new Date(now - val * 3600000).toISOString();
    if (timeStr.includes('j')) return new Date(now - val * 86400000).toISOString();
    return now.toISOString();
}
