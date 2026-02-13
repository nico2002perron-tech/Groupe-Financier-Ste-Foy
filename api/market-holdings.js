
// api/market-holdings.js — Holdings & secteurs mis à jour 1x/mois via Groq
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── CDN CACHE: 30 jours (2592000s) ──
    // Vercel CDN servira la même réponse pendant 30 jours
    // stale-while-revalidate = 1 jour de grâce pendant le refresh
    res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate=86400');

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY manquante');
        return res.status(200).json({ success: true, data: getFallbackData(), source: 'fallback' });
    }

    try {
        const now = new Date();
        const monthYear = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const prompt = `Tu es un analyste financier factuel. Nous sommes en ${monthYear}.

Donne-moi les données ACTUELLES pour ces 6 indices/actifs. Utilise tes connaissances les plus récentes.

INDICES:
1. S&P/TSX Composite (Canada)
2. S&P 500 (USA)
3. NASDAQ 100 (USA)
4. Dow Jones Industrial Average (USA)
5. Or (Gold, XAU/USD)
6. Pétrole WTI (CL/USD)

Pour chaque INDICE BOURSIER (1 à 4), donne:
- "holdings": les 5 plus gros holdings avec leur poids approximatif en % (ex: "Apple 7.1%")
- "sectors": les 3 plus gros secteurs avec leur poids en % (ex: "Tech 32%")
- "sectorKeys": pour chaque secteur, un mot-clé parmi: tech, finance, health, energy, industry, consumer, commodity, safe

Pour l'OR (5) et le PÉTROLE (6), donne:
- "holdings": 4 faits éducatifs courts (ex: "1 once = 31.1g", "Réserve de valeur")
- "sectors": 2 catégories (ex: "Matière première", "Valeur refuge")
- "sectorKeys": les mots-clés correspondants

IMPORTANT:
- Données factuelles uniquement, ZÉRO opinion ou prédiction
- Poids approximatifs acceptables (à ±1%)
- Si tu n'es pas sûr d'un poids exact, donne ta meilleure estimation

Réponds UNIQUEMENT en JSON pur, sans markdown:
{
  "lastUpdate": "${monthYear}",
  "indices": {
    "tsx": { "holdings": ["Royal Bank 6.3%", ...], "sectors": ["Finance 33%", ...], "sectorKeys": ["finance", ...] },
    "spx": { "holdings": [...], "sectors": [...], "sectorKeys": [...] },
    "ndx": { "holdings": [...], "sectors": [...], "sectorKeys": [...] },
    "dji": { "holdings": [...], "sectors": [...], "sectorKeys": [...] },
    "gold": { "holdings": [...], "sectors": [...], "sectorKeys": [...] },
    "oil": { "holdings": [...], "sectors": [...], "sectorKeys": [...] }
  }
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
                        content: 'Tu es un analyste financier factuel. Tu réponds uniquement en JSON pur, sans backticks ni markdown. Données approximatives acceptables.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!groqResponse.ok) {
            console.error('❌ Groq erreur:', groqResponse.status);
            return res.status(200).json({ success: true, data: getFallbackData(), source: 'fallback' });
        }

        const groqData = await groqResponse.json();
        let content = groqData.choices?.[0]?.message?.content || '';

        // Nettoyer le JSON
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

        const parsed = JSON.parse(content);

        console.log(`✅ Holdings mis à jour pour ${monthYear}`);

        return res.status(200).json({
            success: true,
            data: parsed,
            source: 'groq',
            cached: false
        });

    } catch (error) {
        console.error('❌ Erreur market-holdings:', error.message);
        return res.status(200).json({
            success: true,
            data: getFallbackData(),
            source: 'fallback'
        });
    }
}

// Données de secours si Groq échoue
function getFallbackData() {
    return {
        lastUpdate: 'février 2025',
        indices: {
            tsx: {
                holdings: ['Royal Bank 6.3%', 'TD Bank 5.1%', 'Shopify 4.8%', 'Enbridge 3.9%', 'CN Rail 3.5%'],
                sectors: ['Finance 33%', 'Énergie 17%', 'Industrie 13%'],
                sectorKeys: ['finance', 'energy', 'industry']
            },
            spx: {
                holdings: ['Apple 7.1%', 'Microsoft 6.8%', 'NVIDIA 6.2%', 'Amazon 3.8%', 'Meta 2.7%'],
                sectors: ['Tech 32%', 'Finance 13%', 'Santé 12%'],
                sectorKeys: ['tech', 'finance', 'health']
            },
            ndx: {
                holdings: ['Apple 8.9%', 'Microsoft 8.1%', 'NVIDIA 7.6%', 'Broadcom 4.9%', 'Amazon 4.7%'],
                sectors: ['Tech 58%', 'Conso. 19%', 'Santé 7%'],
                sectorKeys: ['tech', 'consumer', 'health']
            },
            dji: {
                holdings: ['UnitedHealth 8.4%', 'Goldman Sachs 7.2%', 'Microsoft 5.8%', 'Home Depot 5.6%', 'Caterpillar 5.1%'],
                sectors: ['Finance 22%', 'Tech 20%', 'Santé 17%'],
                sectorKeys: ['finance', 'tech', 'health']
            },
            gold: {
                holdings: ['1 once = 31.1g', 'Réserve de valeur', 'Anti-inflation', 'Non corrélé aux actions'],
                sectors: ['Matière première', 'Valeur refuge'],
                sectorKeys: ['commodity', 'safe']
            },
            oil: {
                holdings: ['Coté en $/baril', 'Canada = 2e exportateur', 'Impact direct sur le TSX', 'Cyclique'],
                sectors: ['Matière première', 'Énergie'],
                sectorKeys: ['commodity', 'energy']
            }
        }
    };
}
