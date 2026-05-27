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
        { url: 'coblive.html', icon: '\uD83D\uDCB0', label: 'Cobranca de Lives' },
        { url: 'pix.automatizado.html', icon: '\uD83D\uDCB3', label: 'Pix Automacao' },
        { url: 'pix.manual.html', icon: '\u2705', label: 'Pix Manual', badgeId: 'nav-pix-badge' },
        { url: 'vendas.html', icon: '\uD83D\uDED2', label: 'Vendas' },
        { url: 'clientes.html', icon: '\uD83D\uDC65', label: 'Clientes' },
        { url: 'enderecos.html', icon: '\uD83D\uDCCD', label: 'Enderecos' },
        { url: 'rastreamento.html', icon: '\uD83D\uDCE6', label: 'Solicitacoes de Entregas' },
        { url: 'whatsapp-monitor.html', icon: '\uD83D\uDCF1', label: 'Monitor WhatsApp' },
        { url: 'configuracao-pagamento.html', icon: '\u2699\uFE0F', label: 'Config. Pagamento' },
        { url: 'solicitacoes.html', icon: '\uD83D\uDCDD', label: 'Formulario de Entregas' }
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

    // Injetar CSS do menu
    function injectCSS() {
        if (document.getElementById('nav-menu-styles')) return;
        var style = document.createElement('style');
        style.id = 'nav-menu-styles';
        style.textContent = `
/* ============================================
   NAVEGACAO - Menu Mobile/Responsive
   Injeta menu hamburger em todas as paginas
   ============================================ */

/* ----- Botao Hamburger ----- */
.nav-menu-btn {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 8px;
    margin-right: 8px;
    border-radius: 8px;
    transition: background 0.2s;
    flex-shrink: 0;
}
.nav-menu-btn:hover {
    background: rgba(0, 0, 0, 0.08);
}
.nav-menu-btn svg {
    width: 24px;
    height: 24px;
}

/* ----- Overlay ----- */
.nav-menu-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}
.nav-menu-overlay.active {
    display: block;
}

/* ----- Painel do Menu ----- */
.nav-menu-panel {
    position: fixed;
    top: 0;
    left: -320px;
    width: 320px;
    max-width: 85vw;
    height: 100vh;
    height: 100dvh;
    background: #0a1628;
    z-index: 9999;
    transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
}
.nav-menu-panel.active {
    left: 0;
}

/* Scrollbar estilizada */
.nav-menu-panel::-webkit-scrollbar {
    width: 5px;
}
.nav-menu-panel::-webkit-scrollbar-track {
    background: transparent;
}
.nav-menu-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
}

/* ----- Header do Menu ----- */
.nav-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: #0a1628;
    z-index: 2;
}
.nav-menu-header .nav-menu-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    font-size: 16px;
    font-weight: 700;
}
.nav-menu-header .nav-menu-brand svg {
    width: 28px;
    height: 28px;
}
.nav-menu-close {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    line-height: 1;
    padding: 0;
}
.nav-menu-close:hover {
    background: rgba(255, 255, 255, 0.15);
}

/* ----- Links do Menu ----- */
.nav-menu-links {
    padding: 12px 14px;
    flex: 1;
}
.nav-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 12px;
    transition: all 0.2s ease;
    margin-bottom: 3px;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    position: relative;
}
.nav-menu-item .nav-icon {
    font-size: 20px;
    width: 26px;
    text-align: center;
    flex-shrink: 0;
}
.nav-menu-item .nav-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nav-menu-item:hover {
    background: rgba(0, 102, 255, 0.15);
    color: white;
}
.nav-menu-item.active {
    background: rgba(0, 102, 255, 0.22);
    color: white;
    font-weight: 600;
}
.nav-menu-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #0066ff;
    border-radius: 0 3px 3px 0;
}

/* Badge de contador */
.nav-menu-badge {
    background: #ef4444;
    color: white;
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    min-width: 20px;
    text-align: center;
}

/* Separador */
.nav-menu-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 10px 16px;
}
.nav-menu-section-title {
    padding: 10px 18px 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.35);
}

/* ----- Footer do Menu ----- */
.nav-menu-footer {
    padding: 14px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
    background: #0a1628;
}
.nav-menu-footer .nav-menu-item {
    padding: 10px 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
}
.nav-menu-footer .nav-menu-item:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
}

/* ----- Versao ----- */
.nav-menu-version {
    text-align: center;
    padding: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.2);
}

/* ----- Animacao de entrada dos itens ----- */
.nav-menu-panel.active .nav-menu-item {
    animation: navItemSlide 0.35s ease backwards;
}
.nav-menu-panel.active .nav-menu-item:nth-child(1) { animation-delay: 0.03s; }
.nav-menu-panel.active .nav-menu-item:nth-child(2) { animation-delay: 0.06s; }
.nav-menu-panel.active .nav-menu-item:nth-child(3) { animation-delay: 0.09s; }
.nav-menu-panel.active .nav-menu-item:nth-child(4) { animation-delay: 0.12s; }
.nav-menu-panel.active .nav-menu-item:nth-child(5) { animation-delay: 0.15s; }
.nav-menu-panel.active .nav-menu-item:nth-child(6) { animation-delay: 0.18s; }
.nav-menu-panel.active .nav-menu-item:nth-child(7) { animation-delay: 0.21s; }
.nav-menu-panel.active .nav-menu-item:nth-child(8) { animation-delay: 0.24s; }
.nav-menu-panel.active .nav-menu-item:nth-child(9) { animation-delay: 0.27s; }
.nav-menu-panel.active .nav-menu-item:nth-child(10) { animation-delay: 0.30s; }
.nav-menu-panel.active .nav-menu-item:nth-child(11) { animation-delay: 0.33s; }

@keyframes navItemSlide {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* ----- Responsivo: mostrar botao hamburger em todas as telas ----- */
/* O botao e sempre visivel para facilitar navegacao */
.nav-menu-btn {
    display: inline-flex !important;
}

/* Em telas muito pequenas, ajustar */
@media (max-width: 480px) {
    .nav-menu-panel {
        width: 280px;
    }
}

/* Prevenir scroll do body quando menu aberto */
body.nav-menu-open {
    overflow: hidden;
}
        `;
        document.head.appendChild(style);
    }

    function init() {
        injectCSS();
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
