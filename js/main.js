document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menuClose = document.querySelector('.menu-close');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    function openMenu() {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle) menuToggle.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // --- Sticky Header Shadow ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        } else {
            navbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
        }
    });

    // --- Service Accordion Toggle (V3) with Image Swap ---
    const accordionItems = document.querySelectorAll('.accordion-item');
    const featuredImage = document.getElementById('services-featured-img');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            // Close all other items
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');

            // Swap the featured image if item is now active
            if (item.classList.contains('active') && featuredImage) {
                const newImageSrc = item.dataset.image;
                if (newImageSrc) {
                    featuredImage.style.opacity = '0';
                    setTimeout(() => {
                        featuredImage.src = newImageSrc;
                        featuredImage.style.opacity = '1';
                    }, 200);
                }
            }
        });
    });

    // --- Economic Cycle Interaction V2 (Ultra Modern) ---
    const radarQuadrants = document.querySelectorAll('.radar-quadrant');
    const cycleTitle = document.getElementById('cycle-title');
    const cycleDesc = document.getElementById('cycle-desc');

    const cycleData = {
        expansion: {
            title: "Expansion",
            desc: "Positionnement équilibré. Nous profitons de la croissance des marchés tout en surveillant les indicateurs d'inflation."
        },
        surchauffe: {
            title: "Surchauffe",
            desc: "Gestion du risque accrue. Réduction de l'exposition aux actifs volatils et prise de profits stratégique."
        },
        recession: {
            title: "Récession",
            desc: "Protection du capital. Focus sur les valeurs refuges et les obligations de qualité pour préserver votre patrimoine."
        },
        reprise: {
            title: "Reprise",
            desc: "Opportunités ciblées. Identification des secteurs (Tech, Indus) à fort potentiel de rebond pour maximiser la performance future."
        }
    };

    radarQuadrants.forEach(quadrant => {
        quadrant.addEventListener('click', () => {
            // Remove active from all
            radarQuadrants.forEach(q => q.classList.remove('active'));
            // Add active to clicked
            quadrant.classList.add('active');

            // Update Text & Color
            const phase = quadrant.getAttribute('data-phase');
            if (cycleData[phase]) {
                cycleTitle.textContent = cycleData[phase].title;
                cycleDesc.textContent = cycleData[phase].desc;

                // Update Gradient Class dynamically
                // Reset basic classes then add specific gradient
                cycleTitle.className = `text-gradient-${phase}`;
            }
        });
    });



    // --- Stats Counter Animation ---
    const statsSection = document.getElementById('stats');
    const statNumbers = document.querySelectorAll('.stat-number');
    let started = false;

    function startCount(el) {
        const target = parseInt(el.dataset.target);
        const count = +el.innerText.replace(/\D/g, ''); // Remove non-digits
        const increment = target / 50; // Speed of counting

        if (count < target) {
            el.innerText = Math.ceil(count + increment);
            setTimeout(() => startCount(el), 30);
        } else {
            // Formatting final output
            if (target === 150) el.innerText = target + " M$";
            else if (target === 100) el.innerText = target + " %";
            else el.innerText = target + "+";
        }
    }

    if (statsSection) {
        const observerStats = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !started) {
                statNumbers.forEach(startCount);
                started = true;
            }
        });
        observerStats.observe(statsSection);
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current
            item.classList.toggle('active');
        });
    });

    // --- Back to Top Button ---
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Re-run icons just in case
    lucide.createIcons();
});

// --- Team Carousel Logic (Continuous Marquee) ---
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('team-track');
    const prevBtn = document.getElementById('team-prev');
    const nextBtn = document.getElementById('team-next');

    if (!track) return;

    // 1. Clone items for seamless loop
    const originalCards = Array.from(track.children);
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
    });

    // 2. Variables
    let currentX = 0;
    let speed = 0.4; // Very slow speed (pixels per frame)
    let isPaused = false;
    let animationId;

    // We need to know the width of the original set to know when to reset
    // This needs to be calculated after layout
    let totalOriginalWidth = 0;

    function calculateDimensions() {
        if (originalCards.length > 0) {
            const firstCard = originalCards[0];
            const cardWidth = firstCard.offsetWidth;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.gap) || 20;

            // Total width comprising all original cards + gaps
            totalOriginalWidth = (cardWidth + gap) * originalCards.length;
        }
    }

    // 3. Animation Loop
    function animate() {
        if (!isPaused) {
            currentX += speed;

            // Seamless Reset: relative to the LEFT movement
            // We translate NEGATIVE X. So if we moved `totalOriginalWidth` pixels, we reset.
            if (currentX >= totalOriginalWidth) {
                currentX = 0;
                // If speed is extremely high, we might want currentX %= totalOriginalWidth, but for 0.5px it's fine.
            }

            track.style.transform = `translateX(-${currentX}px)`;
        }
        animationId = requestAnimationFrame(animate);
    }

    // 4. Start
    // Wait a moment for layout to stabilize
    setTimeout(() => {
        calculateDimensions();
        animate();
    }, 500);

    // Handle Resize
    window.addEventListener('resize', calculateDimensions);

    // 5. Interactions
    // Pause on hover
    const wrapper = document.querySelector('.team-carousel-wrapper');
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => isPaused = true);
        wrapper.addEventListener('mouseleave', () => isPaused = false);
    }

    // Buttons
    // In a continuous marquee, "next" usually means "speed up" or "jump forward".
    // Let's make them shift the position by one card width smoothly-ish (instant shift)

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const cardWidth = originalCards[0].offsetWidth + 20; // 20 is gap
            currentX += cardWidth;
            if (currentX >= totalOriginalWidth) currentX -= totalOriginalWidth;
            track.style.transform = `translateX(-${currentX}px)`;
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const cardWidth = originalCards[0].offsetWidth + 20;
            currentX -= cardWidth;
            if (currentX < 0) currentX += totalOriginalWidth;
        });
    }
});


// --- Custom TradingView Hybrid Carousel (Clone Only - Logic Removed) ---
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('marches-track');
    if (!track) return;

    // 1. Clone cards for seamless scrolling
    const originalCards = Array.from(track.querySelectorAll('.market-card'));
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
    });
});


/* =========================================
   RADAR I.A. - VERSION 100% GRATUITE
   ========================================= */

// Sources RSS gratuites en français
const RSS_FEEDS = {
    all: [
        { url: 'https://ici.radio-canada.ca/rss/71', name: 'Radio-Canada' },
        { url: 'https://www.lesaffaires.com/rss/manchettes.xml', name: 'Les Affaires' }
    ],
    finance: [
        { url: 'https://www.lesaffaires.com/rss/bourse.xml', name: 'Les Affaires' },
        { url: 'https://ici.radio-canada.ca/rss/71', name: 'Radio-Canada' }
    ],
    tech: [
        { url: 'https://www.journaldunet.com/rss/', name: 'Journal du Net' }
    ]
};

// Symboles boursiers par secteur (pour Yahoo Finance)
const SECTOR_TICKERS = {
    all: ['SPY', 'QQQ', 'DIA'],
    health: ['XLV', 'JNJ', 'PFE'],
    tech: ['QQQ', 'AAPL', 'MSFT', 'NVDA'],
    crypto: ['BTC-USD', 'ETH-USD'],
    industrial: ['XLI', 'CAT', 'BA'],
    energy: ['XLE', 'XOM', 'CVX'],
    finance: ['XLF', 'JPM', 'BAC'],
    defensive: ['XLP', 'PG', 'KO']
};

// Fonction principale - 100% GRATUITE
async function loadNewsGratuit(sector) {
    const container = document.getElementById('news-container');

    if (!container) return;

    container.innerHTML = `
        <div class="news-loading">
            <div class="loading-spinner"></div>
            <p>Analyse des marchés en cours...</p>
        </div>
    `;

    try {
        const feeds = RSS_FEEDS[sector] || RSS_FEEDS.all;
        const newsPromises = feeds.map(feed => fetchRSS(feed));
        const newsArrays = await Promise.all(newsPromises);
        const allNews = newsArrays.flat();

        const recentNews = allNews.filter(news => {
            const ageInDays = (Date.now() - new Date(news.pubDate)) / (1000 * 60 * 60 * 24);
            return ageInDays <= 2;
        });

        const newsWithTickers = await Promise.all(
            recentNews.slice(0, 5).map(news => addTickersToNews(news, sector))
        );

        if (newsWithTickers.length === 0) {
            container.innerHTML = `
                <div class="news-empty">
                    <i data-lucide="inbox"></i>
                    <p>Aucune nouvelle récente disponible.</p>
                </div>
            `;
        } else {
            container.innerHTML = newsWithTickers.map(news => createNewsCard(news)).join('');
        }

        if (window.lucide) window.lucide.createIcons();

        // Update last update time if element exists
        const lastUpdateTimeEl = document.getElementById('last-update-time');
        if (lastUpdateTimeEl) {
            const now = new Date();
            lastUpdateTimeEl.textContent = `Dernière mise à jour : ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        }

    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = `
            <div class="news-empty">
                <i data-lucide="alert-circle"></i>
                <p>Erreur lors du chargement des nouvelles.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}

// Charger un flux RSS (100% gratuit)
async function fetchRSS(feed) {
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxyUrl + encodeURIComponent(feed.url));
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        const news = [];
        items.forEach((item, index) => {
            if (index < 5) {
                news.push({
                    title: item.querySelector('title')?.textContent || '',
                    summary: extractSummary(item.querySelector('description')?.textContent || ''),
                    link: item.querySelector('link')?.textContent || '',
                    pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
                    source: feed.name
                });
            }
        });

        return news;

    } catch (error) {
        console.error(`Erreur RSS ${feed.name}:`, error);
        return [];
    }
}

// Extraire un résumé court (première phrase)
function extractSummary(description) {
    const clean = description.replace(/<[^>]*>/g, '');
    const firstSentence = clean.split('.')[0];
    return firstSentence.substring(0, 150) + (firstSentence.length > 150 ? '...' : '.');
}

// Ajouter les variations boursières (Yahoo Finance gratuit)
async function addTickersToNews(news, sector) {
    try {
        const symbols = SECTOR_TICKERS[sector] || SECTOR_TICKERS.all;
        const selectedSymbols = symbols.slice(0, 2);

        const tickerPromises = selectedSymbols.map(symbol => getYahooQuote(symbol));
        const tickers = await Promise.all(tickerPromises);

        return {
            ...news,
            tickers: tickers.filter(t => t !== null),
            time: getTimeAgo(news.pubDate)
        };

    } catch (error) {
        console.error('Erreur tickers:', error);
        return { ...news, tickers: [], time: getTimeAgo(news.pubDate) };
    }
}

// Obtenir une quote Yahoo Finance (100% GRATUIT)
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
        const changeStr = change.toFixed(2);

        return {
            symbol: symbol,
            change: `${change > 0 ? '+' : ''}${changeStr}%`,
            isUp: change > 0,
            starred: Math.abs(change) > 2
        };

    } catch (error) {
        console.error(`Erreur quote ${symbol}:`, error);
        return null;
    }
}

// Calculer le temps écoulé
function getTimeAgo(pubDate) {
    const now = new Date();
    const published = new Date(pubDate);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}j`;
}

// Créer une carte de nouvelle
function createNewsCard(news) {
    const isNew = news.time.includes('min') || (news.time.includes('h') && parseInt(news.time) < 3);

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
        </div>
    `;
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function () {
    loadNewsGratuit('all');

    const sectorButtons = document.querySelectorAll('.sector-btn');
    sectorButtons.forEach(button => {
        button.addEventListener('click', function () {
            sectorButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const sector = this.getAttribute('data-sector');
            loadNewsGratuit(sector);
        });
    });

    const refreshBtn = document.getElementById('refresh-ai-news');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            const activeSymbol = document.querySelector('.sector-btn.active');
            const activeSector = activeSymbol ? activeSymbol.getAttribute('data-sector') : 'all';
            loadNewsGratuit(activeSector);
        });
    }

    setInterval(() => {
        const activeSymbol = document.querySelector('.sector-btn.active');
        const activeSector = activeSymbol ? activeSymbol.getAttribute('data-sector') : 'all';
        loadNewsGratuit(activeSector);
    }, 15 * 60 * 1000);
});
