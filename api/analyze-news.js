// api/analyze-news.js - VERSION ULTRA ROBUSTE
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let rawGroqResponse = "N/A";

    try {
        const { sector = 'all' } = req.body;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) return res.status(500).json({ error: 'CONFIG_ERROR', message: 'GROQ_API_KEY is missing' });

        const sectorNames = { all: 'tous les secteurs', health: 'santé', tech: 'technologie', crypto: 'crypto', industrial: 'industriel', energy: 'énergie', finance: 'finance', defensive: 'défensif' };
        const sectorName = sectorNames[sector] || sectorNames.all;
        const tickers = { all: ['SPY', 'QQQ'], health: ['XLV', 'JNJ'], tech: ['QQQ', 'AAPL'], crypto: ['BTC-USD', 'ETH-USD'], industrial: ['XLI', 'CAT'], energy: ['XLE', 'XOM'], finance: ['XLF', 'JPM'], defensive: ['XLP', 'PG'] }[sector] || ['SPY', 'QQQ'];

        const prompt = `Tu es un analyste financier. Date: ${new Date().toLocaleDateString('fr-FR')}.
TÂCHE: Trouve 3 nouvelles financières RÉCENTES (<48h) sur le secteur "${sectorName}".
FORMAT: Réponds UNIQUEMENT avec un objet JSON valide:
{
  "articles": [
    {
      "title": "...",
      "summary": "...",
      "source": "...",
      "time": "2h",
      "link": "...",
      "tickers": ["${tickers[0]}", "${tickers[1]}"]
    }
  ]
}`;

        console.log("Calling Groq API...");
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: 'Tu es un analyste financier. Tu réponds UNIQUEMENT en JSON.' }, { role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        rawGroqResponse = data.choices[0].message.content;

        const start = rawGroqResponse.indexOf('{');
        const end = rawGroqResponse.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error(`No JSON found in Groq response: ${rawGroqResponse.substring(0, 100)}`);

        const analyzed = JSON.parse(rawGroqResponse.substring(start, end + 1));

        const articlesWithTickers = await Promise.all((analyzed.articles || []).map(async (article) => {
            const symbols = article.tickers || [];
            const tickerData = await Promise.all(symbols.map(s => getYahooQuote(s)));
            return {
                ...article,
                pubDate: estimatePubDate(article.time || '1h'),
                tickers: tickerData.filter(t => t !== null)
            };
        }));

        return res.status(200).json({ success: true, articles: articlesWithTickers, sector: sectorName });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        return res.status(500).json({
            error: 'RUNTIME_ERROR',
            message: error.message,
            rawResponse: rawGroqResponse.substring(0, 500)
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
        const price = meta.regularMarketPrice;
        const prev = meta.previousClose || meta.chartPreviousClose;
        if (!price || !prev) return null;
        const chg = ((price - prev) / prev * 100);
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
