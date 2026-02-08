/* =========================================
   RADAR I.A. - MODE SERVEUR UNIQUE
   ========================================= */

// URL de l'API (Même domaine Vercel)
const API_URL = '/api/analyze-news';

// Fonction principale
async function loadNewsGratuit(sector) {
    const container = document.getElementById('news-container');

    if (!container) return;

    container.innerHTML = `
        <div class="news-loading">
            <div class="loading-spinner"></div>
            <p>🤖 Appel de l'analyse I.A. pour ${getSectorName(sector)}...</p>
        </div>
    `;

    try {
        // 1️⃣ LOG FRONTEND
        console.log("Calling API:", API_URL, "for sector:", sector);

        // Appel UNIQUE au backend - Aucune logique RSS ici !
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sector: sector
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API error');
        }

        const data = await response.json();

        // Log du debug reçu du serveur
        if (data.debug) {
            console.log("=== API DEBUG INFO ===");
            console.log("Groq Key:", data.debug.groqKey);
            console.log("Articles Received:", data.debug.articlesReceived);
            console.log("AI Called:", data.debug.aiCalled);
        }

        if (!data.success || !data.articles || data.articles.length === 0) {
            container.innerHTML = `
                <div class="news-empty">
                    <i data-lucide="inbox"></i>
                    <p>Aucune nouvelle disponible (même en mode brut).</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Afficher les nouvelles (IA ou Brutes en cas de fallback)
        container.innerHTML = data.articles.map(news => createNewsCard(news)).join('');
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error('Frontend Error:', error);
        container.innerHTML = `
            <div class="news-empty">
                <i data-lucide="alert-circle"></i>
                <p>Erreur lors de l'appel API. Vérifiez la console.</p>
                <p style="font-size: 0.85rem; margin-top: 10px; color: #94a3b8;">
                    ${error.message}
                </p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

// Calculer le temps écoulé
function getTimeAgo(pubDate) {
    const diffMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
}

// Nom du secteur
function getSectorName(sector) {
    const names = {
        all: 'tous les secteurs',
        health: 'santé',
        tech: 'technologie',
        crypto: 'crypto',
        industrial: 'industriel',
        energy: 'énergie',
        finance: 'finance',
        defensive: 'défensif'
    };
    return names[sector] || sector;
}

// Créer carte de nouvelle
function createNewsCard(news) {
    const isNew = news.time && (news.time.includes('min') || (news.time.includes('h') && parseInt(news.time) < 3));

    return `
        <div class="news-card">
            <h3 class="news-title">
                ${news.title}
                ${isNew ? '<span class="badge-new">NOUVEAU</span>' : ''}
            </h3>
            
            <p class="news-summary">${news.summary}</p>
            
            <div class="news-meta">
                <span class="news-source">${news.source}</span>
                <span class="news-time">
                    <i data-lucide="clock"></i>
                    Il y a ${news.time}
                </span>
            </div>
            
            ${news.tickers && news.tickers.length > 0 ? `
                <div class="news-tickers">
                    ${news.tickers.map(ticker => `
                        <div class="ticker-badge">
                            <span class="ticker-symbol">${ticker.symbol}</span>
                            <span class="ticker-change ${ticker.isUp ? 'up' : 'down'}">${ticker.change}</span>
                            ${ticker.starred ? '<span class="ticker-star">★</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${news.link ? `
                <div class="news-actions">
                    <a href="${news.link}" target="_blank" rel="noopener noreferrer" class="read-article-btn">
                        <i data-lucide="external-link"></i>
                        Lire l'article complet
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    // Charger les nouvelles par défaut
    loadNewsGratuit('all');

    // Gérer les boutons de secteur
    const sectorButtons = document.querySelectorAll('.sector-btn');
    sectorButtons.forEach(button => {
        button.addEventListener('click', function () {
            sectorButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            loadNewsGratuit(this.getAttribute('data-sector'));
        });
    });

    // Bouton actualiser
    const refreshBtn = document.getElementById('refresh-ai-news');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.animation = 'spin 1s linear';
                setTimeout(() => icon.style.animation = '', 1000);
            }

            const activeSymbol = document.querySelector('.sector-btn.active');
            const activeSector = activeSymbol ? activeSymbol.getAttribute('data-sector') : 'all';
            loadNewsGratuit(activeSector);
        });
    }

    // Auto-refresh toutes les 15 minutes
    setInterval(() => {
        const activeSymbol = document.querySelector('.sector-btn.active');
        const activeSector = activeSymbol ? activeSymbol.getAttribute('data-sector') : 'all';
        loadNewsGratuit(activeSector);
    }, 15 * 60 * 1000);
});

/* =========================================
   NOTES
   ========================================= */

/*
MODE DIAGNOSTIC - FONCTIONNEMENT:

1. Frontend appelle UNIQUEMENT /api/analyze-news
2. Backend va chercher les RSS lui-même
3. Backend tente d'analyser avec Groq I.A.
4. Si Groq échoue, Backend renvoie les articles bruts (fallback)
5. Frontend affiche ce qu'il reçoit

✅ PLUS AUCUN CORS (tout se passe côté serveur)
✅ PLUS AUCUN APPEL EXTERNE DEPUIS LE NAVIGATEUR
*/
