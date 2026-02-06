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


// --- Featured AI Radar Logic (Fun & Pop - Robust Fallback) ---
document.addEventListener('DOMContentLoaded', () => {
    const aiListEl = document.getElementById('ai-news-list');
    const refreshBtn = document.getElementById('refresh-ai-btn');

    if (!aiListEl) return;

    // 1. Fun Fallback Data (Designed to look exactly like live data)
    const fallbackData = [
        {
            title: "Marchés : L'IA domine encore",
            summary: "Les géants de la tech tirent les indices vers le haut. L'engouement pour l'intelligence artificielle ne faiblit pas.",
            link: "#",
            emoji: "🤖"
        },
        {
            title: "Taux d'intérêt : Statu quo ?",
            summary: "Les banques centrales jouent la prudence. Les investisseurs attendent des signaux clairs sur la baisse des taux.",
            link: "#",
            emoji: "🏦"
        },
        {
            title: "Énergie : Le pétrole rebondit",
            summary: "Tensions géopolitiques et demande accrue font grimper le brut. Un secteur à surveiller cette semaine.",
            link: "#",
            emoji: "🛢️"
        }
    ];

    // 2. Emoji Helper
    function getEmoji(text) {
        const t = text.toLowerCase();
        if (t.includes('ia') || t.includes('tech') || t.includes('apple') || t.includes('nvidia') || t.includes('google')) return '🤖';
        if (t.includes('bourse') || t.includes('marché') || t.includes('dow') || t.includes('sp500') || t.includes('nasdaq')) return '📈';
        if (t.includes('or') || t.includes('pétrole') || t.includes('argent') || t.includes('bitcoin') || t.includes('crypto')) return '💰';
        if (t.includes('chine') || t.includes('europe') || t.includes('monde') || t.includes('guerre')) return '🌍';
        if (t.includes('immobilier') || t.includes('maison') || t.includes('hypothèque')) return '🏠';
        if (t.includes('politique') || t.includes('loi') || t.includes('budget') || t.includes('impôt')) return '⚖️';
        return '🗞️';
    }

    // 3. Renderer Helper
    function renderArticles(articles) {
        let html = '';
        articles.forEach(item => {
            const cleanTitle = item.title.split(' | ')[0];
            // Remove HTML tags from description and shorten to ~110 chars
            let summary = (item.description || item.summary || "Détails à suivre...").replace(/<[^>]*>?/gm, '');
            if (summary.length > 110) summary = summary.substring(0, 110) + '...';

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
        if (window.lucide) window.lucide.createIcons();
    }

    // 4. Main Fetch Function
    async function fetchFeaturedNews() {
        // Loading State
        aiListEl.style.opacity = '0.5';

        // Reliable Feeds priority
        const feeds = [
            'https://api.rss2json.com/v1/api.json?rss_url=https://ici.radio-canada.ca/rss/1000524', // Techno/Science
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lapresse.ca/affaires/rss'      // Affaires
        ];

        let articles = [];

        try {
            const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
            // Add API key if available, otherwise reliance on free tier (rate limited)
            const res = await fetch(randomFeed + '&_t=' + Date.now());

            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const data = await res.json();

            if (data.status === 'ok' && data.items) {
                articles = data.items.filter(item =>
                    !item.title.includes('Météo') &&
                    !item.title.includes('Horoscope') &&
                    !item.title.includes('Kijiji')
                );
            } else {
                throw new Error("API returned status not ok");
            }
        } catch (e) {
            console.warn("Radar API unavailable (" + e.message + "), switching to Fallback Mode.");
            articles = []; // Force fallback
        }

        // If API search failed or returned too few items, use fallback
        if (articles.length < 3) {
            // Fill remaining spots with fallback data
            const needed = 3 - articles.length;
            for (let i = 0; i < needed; i++) {
                articles.push(fallbackData[i % fallbackData.length]);
            }
        }

        // Render exactly 3 items
        renderArticles(articles.slice(0, 3));
        aiListEl.style.opacity = '1';
    }

    // 5. Init
    fetchFeaturedNews();

    // 6. Refresh Logic
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
