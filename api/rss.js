// api/rss.js
// Proxy backend pour récupérer les flux RSS sans erreurs CORS

const ALLOWED_DOMAINS = [
    'lapresse.ca',
    'www.lapresse.ca',
    'lesaffaires.com',
    'www.lesaffaires.com',
    'ledevoir.com',
    'www.ledevoir.com',
    'radio-canada.ca',
    'ici.radio-canada.ca'
];

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing "url" parameter' });
    }

    try {
        const targetUrl = new URL(url);
        const domain = targetUrl.hostname;

        // Sécurité : Vérifier le domaine (Anti-SSRF)
        const isAllowed = ALLOWED_DOMAINS.some(allowed => domain === allowed || domain.endsWith('.' + allowed));

        if (!isAllowed) {
            return res.status(403).json({
                error: 'Domain not allowed',
                message: `Le domaine ${domain} n'est pas dans la liste blanche.`
            });
        }

        // Fetch avec timeout (10 secondes)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GroupeFinancierSteFoy-RSSProxy/1.0 (+https://groupe-financier-ste-foy-vb4s.vercel.app)'
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Fetch failed',
                status: response.status,
                message: `Impossible de récupérer le flux RSS: ${response.statusText}`
            });
        }

        const xml = await response.text();

        // Caching headers pour Vercel Edge Cache
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');

        return res.status(200).send(xml);

    } catch (error) {
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Gateway Timeout', message: 'La source RSS a mis trop de temps à répondre.' });
        }
        console.error('RSS Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
