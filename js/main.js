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


// --- AI Analyst Simulation ---
document.addEventListener('DOMContentLoaded', () => {
    const aiSection = document.querySelector('.ai-radar-section');
    const aiTextEl = document.getElementById('ai-news-list');
    const introTextEl = document.getElementById('radar-intro-text');
    const refreshBtn = document.getElementById('refresh-ai-btn');

    const fallbackAnalyses = [
        "<li><span class='radar-bullet'></span><div class='radar-item-content'><span class='radar-category'>Marchés Mondiaux</span> : <span class='radar-text'>La volatilité reste élevée alors que les investisseurs surveillent les décisions des banques centrales.</span> <a href='https://ici.radio-canada.ca/economie' target='_blank' class='radar-source'>Source : Radio-Canada</a></div></li>",
        "<li><span class='radar-bullet'></span><div class='radar-item-content'><span class='radar-category'>Secteur Technologique</span> : <span class='radar-text'>Le secteur de l'IA continue de dominer les investissements malgré des risques de régulation accrus.</span> <a href='https://ici.radio-canada.ca/techno' target='_blank' class='radar-source'>Source : Radio-Canada</a></div></li>",
        "<li><span class='radar-bullet'></span><div class='radar-item-content'><span class='radar-category'>Matières Premières</span> : <span class='radar-text'>Les prix du pétrole et de l'or fluctuent en réponse aux tensions géopolitiques.</span> <a href='https://fr.euronews.com/tag/matieres-premieres' target='_blank' class='radar-source'>Source : Euronews</a></div></li>"
    ];

    let aiAnalyses = [fallbackAnalyses.join('')]; // PRE-FILL TO AVOID UNDEFINED
    let hasRun = false;
    let isTyping = false;
    let lastAnalysisIndex = -1;

    async function fetchLiveNews() {
        // 1. Check Daily Cache (v10 - Guaranteed 3 articles & Longer Text)
        const todayStr = new Date().toISOString().split('T')[0];
        const cached = localStorage.getItem('gfstefoy_ai_daily_cache_v10');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.date === todayStr && !window.forceRefreshAI) {
                    aiAnalyses = [parsed.html];
                    return;
                }
            } catch (e) { localStorage.removeItem('gfstefoy_ai_daily_cache_v10'); }
        }

        const feeds = [
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.fool.com/investing/index.aspx?format=rss',
            'https://api.rss2json.com/v1/api.json?rss_url=https://ici.radio-canada.ca/rss/1000524',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.ledevoir.com/rss/section/economie.xml',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lemonde.fr/economie/rss_full.xml',
            'https://api.rss2json.com/v1/api.json?rss_url=https://fr.euronews.com/rss?level=theme&name=business',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lapresse.ca/affaires/rss',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.lesaffaires.com/rss/mieux-investir',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.tvanouvelles.ca/rss/argent',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.boursorama.com/rss/actualites/'
        ];

        const excludeKeywords = ['Hockey', 'Canadien', 'LNH', 'NHL', 'Sport', 'Match', 'Tournoi', 'Olympiques', 'Baseball', 'Football', 'Soccer', 'Météo', 'Police', 'Accident'];
        const boostKeywords = ['Bourse', 'Marché', 'Wall Street', 'Taux', 'Inflation', 'PIB', 'Dette', 'Récession', 'Investissement', 'Banque', 'Économie', 'Finance', 'Politique', 'Trump', 'Chine'];

        let pool = [];
        let motleyFoolPriority = [];
        const processedLinks = new Set();

        for (const feed of feeds) {
            try {
                const response = await fetch(feed + '&_t=' + Date.now());
                const data = await response.json();
                if (data.items) {
                    data.items.forEach(item => {
                        if (!item.link || !item.link.startsWith('http') || processedLinks.has(item.link)) return;
                        processedLinks.add(item.link);

                        const isMotleyFool = item.link.includes("fool.com");
                        const isBreakfastNews = isMotleyFool && item.title.includes("Breakfast News");

                        const pubDate = new Date(item.pubDate);
                        const daysOld = (Date.now() - pubDate) / 86400000;
                        if (isBreakfastNews) { if (daysOld > 2.5) return; }
                        else { if (daysOld > 10) return; }

                        const cleanTitle = item.title.split(' | ')[0].split(' - ')[0];
                        let summary = (item.description || "").replace(/<[^>]*>?/gm, '');

                        // LONGER SUMMARIES REQUEST: Increased limit
                        if (summary.length > 650) {
                            let cutIndex = summary.lastIndexOf('.', 650);
                            summary = (cutIndex > 400) ? summary.substring(0, cutIndex + 1) : summary.substring(0, 650) + "...";
                        }

                        const scanText = (cleanTitle + " " + summary);
                        if (excludeKeywords.some(kw => scanText.includes(kw))) return;

                        let sourceLabel = "Source";
                        if (isMotleyFool) sourceLabel = "The Motley Fool";
                        else if (item.link.includes("ledevoir")) sourceLabel = "Le Devoir";
                        else if (item.link.includes("lemonde")) sourceLabel = "Le Monde";
                        else if (item.link.includes("euronews")) sourceLabel = "Euronews";
                        else if (item.link.includes("radio-canada")) sourceLabel = "Radio-Canada";
                        else if (item.link.includes("lapresse")) sourceLabel = "La Presse";
                        else if (item.link.includes("lesaffaires")) sourceLabel = "Les Affaires";
                        else if (item.link.includes("tvanouvelles")) sourceLabel = "TVA Argent";
                        else if (item.link.includes("boursorama")) sourceLabel = "Boursorama";

                        const dateFormatted = pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                        const html = `
                            <li>
                                <span class="radar-bullet"></span>
                                <div class="radar-item-content">
                                    <span class="radar-category">${cleanTitle}</span> : <span class="radar-text">${summary}</span> <a href="${item.link}" target="_blank" class="radar-source">Source : ${sourceLabel}</a>
                                </div>
                            </li>
                            `;

                        if (isBreakfastNews) motleyFoolPriority.unshift(html);
                        else pool.push(html);
                    });
                }
            } catch (err) { console.warn("Feed Error:", feed); }
        }

        // Final Selection: FILTER OUT UNDEFINED
        let finalItems = [...motleyFoolPriority, ...pool.sort(() => 0.5 - Math.random())]
            .filter(item => item && typeof item === 'string' && !item.includes("undefined"));

        // STRIKING GUARANTEE: If less than 3, we MUST add from fallbacks
        if (finalItems.length < 3) {
            let i = 0;
            while (finalItems.length < 3) {
                finalItems.push(fallbackAnalyses[i % fallbackAnalyses.length]);
                i++;
            }
        }

        // Final Slice to exactly 3
        const resultHTML = finalItems.slice(0, 3).join('');

        // Safety validation
        if (!resultHTML || resultHTML.includes("undefined")) {
            console.error("CRITICAL: Result HTML contains undefined!");
            aiAnalyses = [fallbackAnalyses.join('')]; // Nuclear fallback
        } else {
            aiAnalyses = [resultHTML];
        }

        console.log("AI Analysis Update: Generated " + finalItems.length + " items (Showing 3)");

        localStorage.setItem('gfstefoy_ai_daily_cache_v10', JSON.stringify({
            date: todayStr,
            html: aiAnalyses[0]
        }));
    }

    async function typeWriterDOM(html, targetElement) {
        // FORCE CSS VISIBILITY
        targetElement.style.height = "auto";
        targetElement.style.maxHeight = "none";
        targetElement.style.overflow = "visible";
        targetElement.style.display = "block";

        const template = document.createElement('div');
        template.innerHTML = html;

        targetElement.innerHTML = "";

        async function revealNode(sourceNode, targetNode) {
            if (sourceNode.nodeType === Node.TEXT_NODE) {
                const text = sourceNode.nodeValue;
                const textNode = document.createTextNode("");
                targetNode.appendChild(textNode);
                for (let i = 0; i < text.length; i++) {
                    textNode.nodeValue += text[i];
                    let delay = 1;
                    if ('.!?'.includes(text[i])) delay = 5;
                    await new Promise(r => setTimeout(r, delay));
                }
            } else if (sourceNode.nodeType === Node.ELEMENT_NODE) {
                const newNode = document.createElement(sourceNode.tagName);
                for (let i = 0; i < sourceNode.attributes.length; i++) {
                    newNode.setAttribute(sourceNode.attributes[i].name, sourceNode.attributes[i].value);
                }
                targetNode.appendChild(newNode);
                for (let i = 0; i < sourceNode.childNodes.length; i++) {
                    await revealNode(sourceNode.childNodes[i], newNode);
                }
            }
        }

        for (let i = 0; i < template.childNodes.length; i++) {
            await revealNode(template.childNodes[i], targetElement);
        }
    }
    async function runAIAnalysis(force = false) {
        if (isTyping || (hasRun && !force)) return;
        isTyping = true;
        hasRun = true;
        aiTextEl.innerHTML = "";

        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        let index = Math.floor(Math.random() * aiAnalyses.length);
        if (aiAnalyses.length > 1 && index === lastAnalysisIndex) index = (index + 1) % aiAnalyses.length;
        lastAnalysisIndex = index;

        if (introTextEl) introTextEl.textContent = `Nouvelles d'aujourd'hui, ${dateStr} :`;
        const fullContent = aiAnalyses[index];

        try {
            await typeWriterDOM(fullContent, aiTextEl);
        } catch (e) {
            console.error("AI Typewriter Error:", e);
            aiTextEl.innerHTML = fullContent;
        } finally {
            isTyping = false;
        }
    }

    fetchLiveNews();

    if (aiSection) {
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) { runAIAnalysis(); obs.unobserve(aiSection); }
        }, { threshold: 0.5 });
        obs.observe(aiSection);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function () {
            if (isTyping) return;
            window.forceRefreshAI = true; // Signal to bypass cache
            const icon = this.querySelector('i');
            icon.style.animation = "spin-ai 1s linear infinite";
            aiTextEl.innerHTML = "<div class='typing-cursor'>Analyse des flux financiers en cours...</div>";
            await fetchLiveNews();
            icon.style.animation = "";
            hasRun = false;
            runAIAnalysis(true);
            window.forceRefreshAI = false;
        });
    }
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin-ai {100 % { transform: rotate(360deg); }}`;
document.head.appendChild(styleSheet);
