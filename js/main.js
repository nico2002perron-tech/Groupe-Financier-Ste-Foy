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


// --- Custom TradingView Hybrid Carousel ---
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

    // 2. Function to Load Widgets
    function loadWidgets(range = '1D') {
        console.log("Loading widgets for range:", range); // DEBUG LOG
        const containers = document.querySelectorAll('.tradingview-widget-container');

        if (containers.length === 0) {
            console.error("CRITICAL: No widget containers found!");
        }

        containers.forEach(container => {
            // Clear previous widget
            container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

            const symbol = container.dataset.symbol;

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
            script.async = true;

            // Custom Configuration for "Hidden Logo" look
            const config = {
                "symbol": symbol,
                "width": "100%",
                "height": "100%",
                "locale": "fr",
                "dateRange": range,
                "colorTheme": "dark", // Dark theme fits the blue glass better
                "isTransparent": true, // Critical for glass effect
                "autosize": true,
                "largeChartUrl": "",
                "chartOnly": false,
                "noTimeScale": true // Cleaner look
            };

            script.innerHTML = JSON.stringify(config);
            container.appendChild(script);
        });
    }

    // 3. Initial Load
    loadWidgets('1D');

    // 4. Time Controls Logic
    const buttons = document.querySelectorAll('.time-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Force reload widgets with new range
            const newRange = e.target.dataset.time;
            loadWidgets(newRange);
        });
    });
});


// --- Featured AI Radar Logic (Fun & Pop) ---
document.addEventListener('DOMContentLoaded', () => {
    const aiListEl = document.getElementById('ai-news-list');
    const refreshBtn = document.getElementById('refresh-ai-btn');

    if (!aiListEl) return;

    // 1. Fun Fallback Data
    const fallbackData = [
        { title: "Marchés Wow", summary: "Les bourses mondiales s'affolent ! Les investisseurs ont les yeux rivés sur les banques centrales.", link: "#", emoji: "🌍" },
        { title: "L'IA en Feu", summary: "La tech ne s'arrête jamais. De nouveaux sommets atteints malgré les régulations.", link: "#", emoji: "🤖" },
        { title: "Or & Pétrole", summary: "Ça bouge côté matières premières. L'or brille de mille feux cette semaine.", link: "#", emoji: "💰" }
    ];

    // 2. Emoji Helper
    function getEmoji(text) {
        const t = text.toLowerCase();
        if (t.includes('ia') || t.includes('tech') || t.includes('apple') || t.includes('nvidia')) return '🤖';
        if (t.includes('bourse') || t.includes('marché') || t.includes('dow') || t.includes('sp500')) return '📈';
        if (t.includes('or') || t.includes('pétrole') || t.includes('argent') || t.includes('bitcoin')) return '💰';
        if (t.includes('chine') || t.includes('europe') || t.includes('monde')) return '🌍';
        if (t.includes('immobilier') || t.includes('maison') || t.includes('taux')) return '🏠';
        if (t.includes('politique') || t.includes('loi') || t.includes('trudeau')) return '⚖️';
        return '🗞️';
    }

    // 3. Main Fetch Function
    async function fetchFeaturedNews() {
        // Loading State
        aiListEl.style.opacity = '0.5';

        const feeds = [
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lesaffaires.com/rss/mieux-investir',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lapresse.ca/affaires/rss',
            'https://api.rss2json.com/v1/api.json?rss_url=https://ici.radio-canada.ca/rss/1000524'
        ];

        let articles = [];

        try {
            // Fetch random feed to keep it varied but fast
            const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
            const res = await fetch(randomFeed + '&_t=' + Date.now());
            const data = await res.json();

            if (data.items) {
                articles = data.items.filter(item => !item.title.includes('Kijiji') && !item.title.includes('Météo'));
            }
        } catch (e) {
            console.warn("Feed error, utilizing fallbacks.");
        }

        // Merge with fallbacks if needed to ensure 3 items
        if (articles.length < 3) {
            articles = [...articles, ...fallbackData];
        }

        // Limit to 3 and Render
        const finalSelection = articles.slice(0, 3);

        let html = '';
        finalSelection.forEach(item => {
            const cleanTitle = item.title.split(' | ')[0];
            // Remove HTML tags from description and shorten
            let summary = (item.description || item.summary || "Détails à suivre...").replace(/<[^>]*>?/gm, '');
            if (summary.length > 120) summary = summary.substring(0, 120) + '...';

            const emoji = item.emoji || getEmoji(cleanTitle + " " + summary);
            const link = item.link || "#";

            html += `
                <li class="radar-item-featured">
                    <span class="emoji-icon">${emoji}</span>
                    <div class="radar-content">
                        <h4>${cleanTitle}</h4>
                        <p>${summary}</p>
                        <a href="${link}" target="_blank" class="source-link">Lire l'article <i data-lucide="arrow-right" style="width:14px;"></i></a>
                    </div>
                </li>
            `;
        });

        aiListEl.innerHTML = html;
        aiListEl.style.opacity = '1';

        // Re-init icons for the new arrow
        if (window.lucide) window.lucide.createIcons();
    }

    // 4. Init
    fetchFeaturedNews();

    // 5. Refresh Logic
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            icon.style.animation = "spin-ai 1s linear infinite";
            fetchFeaturedNews().then(() => {
                setTimeout(() => icon.style.animation = "", 500);
            });
        });
    }
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin-ai {100 % { transform: rotate(360deg); }}`;
document.head.appendChild(styleSheet);
