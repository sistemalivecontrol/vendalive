/**
 * ============================================================
 * NAVMENU - Sistema de Navegação para VendaLive
 * Injeta menu hamburger em todas as páginas internas
 * ============================================================
 * Uso: Incluir <link rel="stylesheet" href="navmenu.css"> no <head>
 *      e <script src="navmenu.js"></script> antes do </body>
 */

(function () {
    'use strict';

    // Prevenir inicialização dupla
    if (window.__NAVMENU_INITIALIZED) return;
    window.__NAVMENU_INITIALIZED = true;

    // ========================================
    // CONFIGURAÇÃO
    // ========================================
    const MENU_ITEMS = [
        { url: 'dashboard.html', icon: '📊', label: 'Dashboard', section: 'main' },
        { url: 'live.html', icon: '🎥', label: 'Lives de Vendas', section: 'main' },
        { url: 'clientes.html', icon: '👥', label: 'Clientes', section: 'main' },
        { url: 'vendas.html', icon: '🛒', label: 'Vendas', section: 'main' },
        { url: 'enderecos.html', icon: '📍', label: 'Endereços', section: 'main' },
        { url: 'pix.automatizado.html', icon: '💳', label: 'Pix Automação', section: 'main' },
        { url: 'pix.manual.html', icon: '✅', label: 'Pix Manual', section: 'main', badgeId: 'nav-pix-badge' },
        { url: 'coblive.html', icon: '💰', label: 'Cobrança de Lives', section: 'main' },
        { url: 'configuracao-pagamento.html', icon: '⚙️', label: 'Config. Pagamento', section: 'main' },
        { url: 'solicitacoes.html', icon: '📝', label: 'Formulário de Entregas', section: 'main' },
        { url: 'whatsapp-monitor.html', icon: '📱', label: 'Monitor WhatsApp', section: 'main' },
    ];

    // Mapeamento de nomes de arquivo para facilitar detecção
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

    // ========================================
    // DETECTAR PÁGINA ATUAL
    // ========================================
    function getCurrentPageFile() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
        return filename;
    }

    function isCurrentPage(itemUrl) {
        const current = getCurrentPageFile();
        const aliases = PAGE_ALIASES[itemUrl] || [itemUrl];
        return aliases.some(function (a) {
            return current === a || current === a + '?v=' + getVersionFromUrl();
        });
    }

    function getVersionFromUrl() {
        const match = window.location.search.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }

    // ========================================
    // CRIAR ELEMENTOS
    // ========================================

    // 1. Overlay
    function createOverlay() {
        var div = document.createElement('div');
        div.className = 'nav-menu-overlay';
        div.id = 'navMenuOverlay';
        div.setAttribute('aria-hidden', 'true');
        div.addEventListener('click', closeMenu);
        return div;
    }

    // 2. Painel do Menu
    function createMenuPanel() {
        var panel = document.createElement('nav');
        panel.className = 'nav-menu-panel';
        panel.id = 'navMenuPanel';
        panel.setAttribute('role', 'navigation');
        panel.setAttribute('aria-label', 'Menu principal');

        // Header
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
            '<button class="nav-menu-close" onclick="window.navMenuClose()" aria-label="Fechar menu">&times;</button>';
        panel.appendChild(header);

        // Links container
        var linksContainer = document.createElement('div');
        linksContainer.className = 'nav-menu-links';

        var currentSection = '';

        MENU_ITEMS.forEach(function (item) {
            if (item.section && item.section !== currentSection) {
                currentSection = item.section;
            }

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

        // Footer
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

    // 3. Botão Hamburger
    function createMenuButton() {
        var btn = document.createElement('button');
        btn.className = 'nav-menu-btn';
        btn.id = 'navMenuBtn';
        btn.setAttribute('aria-label', 'Abrir menu de navegação');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'navMenuPanel');
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
    // ESCAPE HTML
    // ========================================
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // CONTROLE DO MENU
    // ========================================
    function openMenu() {
        var overlay = document.getElementById('navMenuOverlay');
        var panel = document.getElementById('navMenuPanel');
        var btn = document.getElementById('navMenuBtn');
        if (overlay && panel) {
            overlay.classList.add('active');
            panel.classList.add('active');
            document.body.classList.add('nav-menu-open');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            var closeBtn = panel.querySelector('.nav-menu-close');
            if (closeBtn) closeBtn.focus();
        }
    }

    function closeMenu() {
        var overlay = document.getElementById('navMenuOverlay');
        var panel = document.getElementById('navMenuPanel');
        var btn = document.getElementById('navMenuBtn');
        if (overlay && panel) {
            overlay.classList.remove('active');
            panel.classList.remove('active');
            document.body.classList.remove('nav-menu-open');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    }

    function goToPage(url) {
        closeMenu();
        setTimeout(function () {
            window.location.href = url;
        }, 280);
    }

    // ========================================
    // TECLADO
    // ========================================
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    }

    // ========================================
    // INSERIR BOTÃO NO HEADER
    // ========================================
    function insertMenuButton() {
        var btn = createMenuButton();

        var headerLeft = document.querySelector('.header-left');
        if (headerLeft) {
            headerLeft.insertBefore(btn, headerLeft.firstChild);
            return true;
        }

        var header = document.querySelector('.header');
        if (header) {
            header.insertBefore(btn, header.firstChild);
            return true;
        }

        btn.style.cssText = 'position:fixed;top:12px;left:12px;z-index:9997;background:#0B193F;color:white;border-radius:8px;padding:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        document.body.appendChild(btn);
        return true;
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        if (document.getElementById('navMenuOverlay')) {
            return;
        }

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
    }

    // ========================================
    // SINCRONIZAR BADGE PIX
    // ========================================
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