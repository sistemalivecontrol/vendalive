/**
 * ============================================================
 * NAVMENU - Sistema de Navegação para VendaLive
 * ============================================================
 */

(function () {
    'use strict';

    if (window.__NAVMENU_INITIALIZED) return;
    window.__NAVMENU_INITIALIZED = true;

    const MENU_ITEMS = [
        { url: 'dashboard.html', icon: '📊', label: 'Dashboard' },
        { url: 'live.html', icon: '🎥', label: 'Lives de Vendas' },
        { url: 'clientes.html', icon: '👥', label: 'Clientes' },
        { url: 'vendas.html', icon: '🛒', label: 'Vendas' },
        { url: 'enderecos.html', icon: '📍', label: 'Endereços' },
        { url: 'pix.automatizado.html', icon: '💳', label: 'Pix Automação' },
        { url: 'pix.manual.html', icon: '✅', label: 'Pix Manual', badgeId: 'nav-pix-badge' },
        { url: 'coblive.html', icon: '💰', label: 'Cobrança de Lives' },
        { url: 'configuracao-pagamento.html', icon: '⚙️', label: 'Config. Pagamento' },
        { url: 'solicitacoes.html', icon: '📝', label: 'Formulário de Entregas' },
        { url: 'whatsapp-monitor.html', icon: '📱', label: 'Monitor WhatsApp' },
    ];

    const PAGE_ALIASES = {
        'dashboard.html': ['dashboard.html', 'index.html', 'index2.html'],
        'live.html': ['live.html'],
        'clientes.html': ['clientes.html'],
        'vendas.html': ['vendas.html'],
        'enderecos.html': ['enderecos.html'],
        'pix.automatizado.html': ['pix.automatizado.html'],
        'pix.manual.html': ['pix.manual.html'],
        'coblive.html': ['coblive.html'],
        'configuracao-pagamento.html': ['configuracao-pagamento.html'],
        'solicitacoes.html': ['solicitacoes.html'],
        'whatsapp-monitor.html': ['whatsapp-monitor.html'],
    };

    function getCurrentPageFile() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
    }

    function isCurrentPage(itemUrl) {
        const current = getCurrentPageFile();
        const aliases = PAGE_ALIASES[itemUrl] || [itemUrl];
        return aliases.some(function (a) {
            return current === a || current.indexOf(a + '?') === 0;
        });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // CRIAR ELEMENTOS
    // ========================================

    function createOverlay() {
        var div = document.createElement('div');
        div.className = 'nav-menu-overlay';
        div.id = 'navMenuOverlay';
        div.addEventListener('click', closeMenu);
        return div;
    }

    function createMenuPanel() {
        var panel = document.createElement('nav');
        panel.className = 'nav-menu-panel';
        panel.id = 'navMenuPanel';

        var header = document.createElement('div');
        header.className = 'nav-menu-header';
        header.innerHTML =
            '<div class="nav-menu-brand">' +
            '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="8" y="15" width="60" height="70" rx="12" stroke="#ffffff" stroke-width="6" fill="none"/>' +
            '<path d="M35 40 L55 52 L35 64 Z" fill="#ffffff"/>' +
            '<path d="M20 75 L35 60" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>' +
            '<circle cx="72" cy="25" r="22" fill="#ffffff"/>' +
            '<text x="72" y="32" text-anchor="middle" fill="#0a1628" font-size="16" font-weight="bold" font-family="Arial">LIVE</text>' +
            '</svg>' +
            '<span>Menu</span>' +
            '</div>' +
            '<button class="nav-menu-close" onclick="window.navMenuClose()">&times;</button>';
        panel.appendChild(header);

        var linksContainer = document.createElement('div');
        linksContainer.className = 'nav-menu-links';

        MENU_ITEMS.forEach(function (item) {
            var isActive = isCurrentPage(item.url);
            var activeClass = isActive ? ' active' : '';
            var badgeHtml = item.badgeId
                ? '<span class="nav-menu-badge" id="' + item.badgeId + '" style="display:none;">0</span>'
                : '';

            var link = document.createElement('a');
            link.href = item.url;
            link.className = 'nav-menu-item' + activeClass;
            link.innerHTML =
                '<span class="nav-icon">' + item.icon + '</span>' +
                '<span class="nav-label">' + escapeHtml(item.label) + '</span>' +
                badgeHtml;

            if (isActive) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    closeMenu();
                });
            } else {
                link.addEventListener('click', function (e) {
                    goToPage(item.url);
                    e.preventDefault();
                });
            }

            linksContainer.appendChild(link);
        });

        panel.appendChild(linksContainer);

        var footer = document.createElement('div');
        footer.className = 'nav-menu-footer';
        footer.innerHTML =
            '<div class="nav-menu-separator"></div>' +
            '<a href="dashboard.html" class="nav-menu-item" onclick="window.navMenuGoTo(event, 'dashboard.html')">' +
            '<span class="nav-icon">🏠</span>' +
            '<span class="nav-label">Dashboard</span>' +
            '</a>' +
            '<button class="nav-menu-item" onclick="window.navMenuLogout()">' +
            '<span class="nav-icon">🚪</span>' +
            '<span class="nav-label">Sair</span>' +
            '</button>';
        panel.appendChild(footer);

        return panel;
    }

    function createMenuButton() {
        var btn = document.createElement('button');
        btn.className = 'nav-menu-btn';
        btn.id = 'navMenuBtn';
        btn.setAttribute('aria-label', 'Abrir menu');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="3" y1="6" x2="21" y2="6"></line>' +
            '<line x1="3" y1="12" x2="21" y2="12"></line>' +
            '<line x1="3" y1="18" x2="21" y2="18"></line>' +
            '</svg>';
        btn.addEventListener('click', openMenu);
        return btn;
    }

    // ========================================
    // CONTROLE DO MENU
    // ========================================
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

    function goToPage(url) {
        closeMenu();
        setTimeout(function () {
            window.location.href = url;
        }, 280);
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') closeMenu();
    }

    // ========================================
    // INSERIR BOTÃO NO HEADER (CORRIGIDO)
    // ========================================
    function insertMenuButton() {
        var btn = createMenuButton();

        // Estratégia 1: Inserir no .header-left (no início)
        var headerLeft = document.querySelector('.header-left');
        if (headerLeft) {
            headerLeft.insertBefore(btn, headerLeft.firstChild);
            console.log('[NAVMENU] Botão inserido em .header-left');
            return true;
        }

        // Estratégia 2: Inserir no .header (no início)
        var header = document.querySelector('.header');
        if (header) {
            header.insertBefore(btn, header.firstChild);
            console.log('[NAVMENU] Botão inserido em .header');
            return true;
        }

        // Estratégia 3: Adicionar como fixed no body (fallback)
        btn.style.cssText = 'position:fixed !important;top:15px !important;left:15px !important;z-index:9998 !important;width:44px !important;height:44px !important;background:#0B193F !important;color:white !important;border:none !important;border-radius:10px !important;cursor:pointer !important;display:flex !important;align-items:center !important;justify-content:center !important;box-shadow:0 2px 10px rgba(0,0,0,0.2) !important;';
        document.body.appendChild(btn);
        console.log('[NAVMENU] Botão inserido como fixed no body');
        return true;
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        if (document.getElementById('navMenuOverlay')) {
            console.log('[NAVMENU] Já inicializado, pulando...');
            return;
        }

        console.log('[NAVMENU] Inicializando menu...');

        insertMenuButton();
        document.body.appendChild(createOverlay());
        document.body.appendChild(createMenuPanel());
        document.addEventListener('keydown', handleKeyDown);

        window.navMenuOpen = openMenu;
        window.navMenuClose = closeMenu;
        window.navMenuGoTo = function (e, url) {
            if (e && e.preventDefault) e.preventDefault();
            goToPage(url);
        };
        window.navMenuLogout = function () {
            closeMenu();
            setTimeout(function () {
                if (typeof logout === 'function') {
                    logout();
                } else if (typeof window.fazerLogout === 'function') {
                    window.fazerLogout();
                } else {
                    window.location.href = 'login.html';
                }
            }, 280);
        };

        syncPixBadge();
        console.log('[NAVMENU] Menu inicializado com sucesso!');
    }

    function syncPixBadge() {
        var observer = new MutationObserver(function () {
            updateNavPixBadge();
        });

        var existingBadges = [
            document.getElementById('pix-badge'),
            document.getElementById('mobile-pix-badge')
        ];

        existingBadges.forEach(function (badge) {
            if (badge) {
                observer.observe(badge, { childList: true, attributes: true });
            }
        });

        updateNavPixBadge();
    }

    function updateNavPixBadge() {
        var sources = ['pix-badge', 'mobile-pix-badge'];
        var total = 0;

        sources.forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.style.display !== 'none') {
                var val = parseInt(el.textContent, 10);
                if (!isNaN(val)) total = Math.max(total, val);
            }
        });

        var navBadge = document.getElementById('nav-pix-badge');
        if (navBadge) {
            if (total > 0) {
                navBadge.textContent = total;
                navBadge.style.display = 'inline-block';
            } else {
                navBadge.style.display = 'none';
            }
        }
    }

    // ========================================
    // INICIAR
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
