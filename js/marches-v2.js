/* =========================================
   MARCHÉS V2 — TradingView + Market Status
   ========================================= */

(function () {
    'use strict';

    // TradingView symbols for each card
    const CHARTS = [
        { containerId: 'tv-tsx', symbol: 'TSX:TXCX', name: 'S&P/TSX' },
        { containerId: 'tv-spx', symbol: 'FOREXCOM:SPXUSD', name: 'S&P 500' },
        { containerId: 'tv-ndx', symbol: 'NASDAQ:NDX', name: 'NASDAQ 100' },
        { containerId: 'tv-dji', symbol: 'DJ:DJI', name: 'Dow Jones' },
        { containerId: 'tv-gold', symbol: 'TVC:GOLD', name: 'Or' },
        { containerId: 'tv-oil', symbol: 'TVC:USOIL', name: 'Pétrole WTI' }
    ];

    function initTradingViewCharts() {
        CHARTS.forEach(function (chart) {
            var container = document.getElementById(chart.containerId);
            if (!container) return;

            // Clear any existing content
            container.innerHTML = '';

            // Create widget div
            var widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            widgetDiv.style.width = '100%';
            widgetDiv.style.height = '100%';
            container.appendChild(widgetDiv);

            // Create and load script
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
            script.async = true;
            script.textContent = JSON.stringify({
                symbol: chart.symbol,
                width: '100%',
                height: '100%',
                locale: 'fr',
                dateRange: '3M',
                colorTheme: 'light',
                isTransparent: true,
                autosize: true,
                largeChartUrl: '',
                noTimeScale: false,
                chartOnly: false
            });

            container.appendChild(script);
        });
    }

    // Market status (US markets: NYSE hours EST)
    function updateMarketStatus() {
        var statusText = document.getElementById('market-status-text');
        var statusDot = document.querySelector('.status-dot');
        if (!statusText || !statusDot) return;

        var now = new Date();
        // Convert to EST
        var est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        var day = est.getDay(); // 0=Sun, 6=Sat
        var hours = est.getHours();
        var minutes = est.getMinutes();
        var time = hours + minutes / 60;

        var isWeekday = day >= 1 && day <= 5;
        var isMarketHours = time >= 9.5 && time < 16; // 9:30 AM - 4:00 PM EST
        var isPreMarket = time >= 4 && time < 9.5;
        var isAfterHours = time >= 16 && time < 20;

        if (isWeekday && isMarketHours) {
            statusText.textContent = 'Marchés ouverts';
            statusDot.className = 'status-dot status-open';
        } else if (isWeekday && isPreMarket) {
            statusText.textContent = 'Pré-marché';
            statusDot.className = 'status-dot status-open';
        } else if (isWeekday && isAfterHours) {
            statusText.textContent = 'Après-bourse';
            statusDot.className = 'status-dot status-closed';
        } else {
            statusText.textContent = 'Marchés fermés';
            statusDot.className = 'status-dot status-closed';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initTradingViewCharts();
        updateMarketStatus();
        // Update status every minute
        setInterval(updateMarketStatus, 60000);
    });
})();
