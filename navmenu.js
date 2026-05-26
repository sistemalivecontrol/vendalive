/**
 * NAVMENU - Menu Hamburger para VendaLive
 */
(function() {
    'use strict';
    if (window.__NAVMENU_INITIALIZED) return;
    window.__NAVMENU_INITIALIZED = true;

    var MENU_ITEMS = [
        { url: 'dashboard.html', icon: '\uD83D\uDCCA', label: 'Dashboard' },
        { url: 'live.html', icon: '\uD83C\uDFA5', label: 'Lives de Vendas' },
        { url: 'clientes.html', icon: '\uD83D\uDC65', label: 'Clientes' },
        { url: 'vendas.html', icon: '\uD83D\uDED2', label: 'Vendas' },
        { url: 'enderecos.html', icon: '\uD83D\uDCCD', label: 'Enderecos' },
        { url: 'pix.automatizado.html', icon: '\uD83D\uDCB3', label: 'Pix Automacao' },
        { url: 'pix.manual.html', icon: '\u2705', label: 'Pix Manual', badgeId: 'nav-pix-badge' },
        { url: 'coblive.html', icon: '\uD83D\uDCB0', label: 'Cobranca de Lives' },
        { url: 'configuracao-pagamento.html', icon: '\u2699\uFE0F', label: 'Config. Pagamento' },
        { url: 'solicitacoes.html', icon: '\uD83D\uDCDD', label: 'Formulario de Entregas' },
        { url: 'whatsapp-monitor.html', icon: '\uD83D\uDCF1', label: 'Monitor WhatsApp' }
    ];

    function getCurrentPage() {
        var path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
    }

    function isCurrent(url) {
        var current = getCurrentPage();
        return current === url || current.indexOf(url + '?') === 0;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createOverlay() {
        var div = document.createElement('div');
        div.className = 'nav-menu-overlay';
        div.id = 'navMenuOverlay';
        div.onclick = closeMenu;
        return div;
    }

    function createPanel() {
        var panel = document.createElement('nav');
        panel.className = 'nav-menu-panel';
        panel.id = 'navMenuPanel';

        var header = document.createElement('div');
        header.className = 'nav-menu-header';
        header.innerHTML = '<div class="nav-menu-brand"><svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="15" width="60" height="70" rx="12" stroke="#ffffff" stroke-width="6" fill="none"/><path d="M35 40 L55 52 L35 64 Z" fill="#ffffff"/><path d="M20 75 L35 60" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/><circle cx="72" cy="25" r="22" fill="#ffffff"/><text x="72" y="32" text-anchor="middle" fill="#0a1628" font-size="16" font-weight="bold" font-family="Arial">LIVE</text></svg><span>Menu</span></div><button class="nav-menu-close" onclick="window.navMenuClose()">&times;</button>';
        panel.appendChild(header);

        var links = document.createElement('div');
        links.className = 'nav-menu-links';

        for (var i = 0; i < MENU_ITEMS.length; i++) {
            var item = MENU_ITEMS[i];
            var active = isCurrent(item.url) ? ' active' : '';
            var badge = item.badgeId ? '<span class="nav-menu-badge" id="' + item.badgeId + '" style="display:none;">0</span>' : '';

            var a = document.createElement('a');
            a.href = item.url;
            a.className = 'nav-menu-item' + active;
            a.innerHTML = '<span class="nav-icon">' + item.icon + '</span><span class="nav-label">' + escapeHtml(item.label) + '</span>' + badge;

            if (active) {
                a.onclick = function(e) { e.preventDefault(); closeMenu(); };
            } else {
                (function(url) {
                    a.onclick = function(e) { e.preventDefault(); goTo(url); };
                })(item.url);
            }
            links.appendChild(a);
        }

        panel.appendChild(links);

        var footer = document.createElement('div');
        footer.className = 'nav-menu-footer';
        footer.innerHTML = '<div class="nav-menu-separator"></div><a href="dashboard.html" class="nav-menu-item" onclick="event.preventDefault();goTo(\'dashboard.html\');"><span class="nav-icon">\uD83C\uDFE0</span><span class="nav-label">Dashboard</span></a><button class="nav-menu-item" onclick="doLogout()"><span class="nav-icon">\uD83D\uDEAA</span><span class="nav-label">Sair</span></button>';
        panel.appendChild(footer);

        return panel;
    }

    function createButton() {
        var btn = document.createElement('button');
        btn.className = 'nav-menu-btn';
        btn.id = 'navMenuBtn';
        btn.setAttribute('aria-label', 'Abrir menu');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        btn.onclick = openMenu;
        return btn;
    }

    function openMenu() {
        var overlay = document.getElementById('navMenuOverlay');
        var panel = document.getElementById('navMenuPanel');
        if (overlay && panel) {
            overlay.classList.add('active');
            panel.classList.add('active');
            document.body.classList.add('nav-menu-open');
        }
    }

    function closeMenu() {
        var overlay = document.getElementById('navMenuOverlay');
        var panel = document.getElementById('navMenuPanel');
        if (overlay && panel) {
            overlay.classList.remove('active');
            panel.classList.remove('active');
            document.body.classList.remove('nav-menu-open');
        }
    }

    function goTo(url) {
        closeMenu();
        setTimeout(function() { window.location.href = url; }, 280);
    }

    function doLogout() {
        closeMenu();
        setTimeout(function() {
            if (typeof window.fazerLogout === 'function') {
                window.fazerLogout();
            } else {
                window.location.href = 'login.html';
            }
        }, 280);
    }

    function insertButton() {
        var btn = createButton();
        var headerLeft = document.querySelector('.header-left');
        if (headerLeft) {
            headerLeft.insertBefore(btn, headerLeft.firstChild);
            return;
        }
        var header = document.querySelector('.header');
        if (header) {
            header.insertBefore(btn, header.firstChild);
            return;
        }
        document.body.appendChild(btn);
    }

    function init() {
        if (document.getElementById('navMenuOverlay')) return;
        insertButton();
        document.body.appendChild(createOverlay());
        document.body.appendChild(createPanel());
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeMenu(); });
        window.navMenuClose = closeMenu;
        window.navMenuGoTo = function(e, url) { if (e) e.preventDefault(); goTo(url); };
        window.navMenuLogout = doLogout;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
