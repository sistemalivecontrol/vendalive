// ==========================================
// SESSION.JS - Sistema de Sessao Unificado
// Verifica login em TODAS as paginas protegidas
// v1.0 - Sessao unica via localStorage + Supabase
// ==========================================

(function() {
    'use strict';

    // ===== CONFIG =====
    const SUPABASE_URL = 'https://aqrvozmxlcgrllclceke.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcnZvem14bGNncmxsY2xjZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTk0MDEsImV4cCI6MjA5MTgzNTQwMX0.6CL3-1dU6WUT4EbJ0UfvmLFj6jGPnT9Avc743WrNiCA';
    const LOGIN_PAGE = 'login.html';
    const SESSAO_KEY = 'usuarioLogado';

    // ===== DETECTAR SE ESTAMOS EM UMA PAGINA PUBLICA =====
    const path = window.location.pathname.toLowerCase();
    const href = window.location.href.toLowerCase();
    const paginasPublicas = [
        'login.html',
        'solicitacao-entrega.html',
        'solicitacoes.html',
        'solicitacoes1.html',
        'coblive.html',
        'pix-pagamento.html',
        'pix-sucesso.html',
        'links.html',
        'index.html',
        'index2.html'
    ];

    function ehPaginaPublica() {
        // Se esta na raiz (index)
        if (path === '/' || path.endsWith('/index.html') || path.endsWith('/index2.html')) return true;
        // Verifica lista de paginas publicas
        for (const pagina of paginasPublicas) {
            if (path.includes(pagina) || href.includes(pagina)) return true;
        }
        return false;
    }

    // ===== VERIFICACAO SINCRONA IMEDIATA =====
    // Esta e a parte mais importante - executa ANTES de qualquer coisa
    function verificarSessaoSincrona() {
        // Nao verifica em paginas publicas
        if (ehPaginaPublica()) {
            console.log('[SESSION] Pagina publica detectada - sem verificacao');
            return true;
        }

        try {
            const sessaoRaw = localStorage.getItem(SESSAO_KEY);
            if (!sessaoRaw) {
                console.log('[SESSION] Sem sessao - redirecionando para login');
                redirecionarParaLogin();
                return false;
            }

            const sessao = JSON.parse(sessaoRaw);
            if (!sessao || !sessao.auth_id || !sessao.usuario_id) {
                console.log('[SESSION] Sessao invalida - redirecionando');
                limparSessao();
                redirecionarParaLogin();
                return false;
            }

            // Verificar se a sessao nao expirou (24 horas)
            if (sessao.login_time) {
                const loginTime = new Date(sessao.login_time).getTime();
                const agora = Date.now();
                const vinteQuatroHoras = 24 * 60 * 60 * 1000;
                if ((agora - loginTime) > vinteQuatroHoras) {
                    console.log('[SESSION] Sessao expirada (24h)');
                    limparSessao();
                    redirecionarParaLogin();
                    return false;
                }
            }

            // Sessao valida!
            console.log('[SESSION] Sessao valida:', sessao.nome || sessao.email);
            window.sessaoUsuario = sessao;
            window.authClienteId = sessao.cliente_id;
            return true;
        } catch (e) {
            console.error('[SESSION] Erro ao verificar sessao:', e);
            limparSessao();
            redirecionarParaLogin();
            return false;
        }
    }

    function redirecionarParaLogin() {
        // Evitar loop de redirecionamento
        if (window.location.href.includes(LOGIN_PAGE)) return;
        window.location.href = LOGIN_PAGE;
    }

    function limparSessao() {
        localStorage.removeItem(SESSAO_KEY);
        localStorage.removeItem('clienteId');
        localStorage.removeItem('nivelAcesso');
        sessionStorage.clear();
    }

    // ===== INICIALIZACAO DO SUPABASE =====
    let supabaseInicializado = false;
    let supabaseInitPromise = null;

    function detectarSupabase() {
        const possiveis = [
            typeof supabase !== 'undefined' ? supabase : null,
            typeof window !== 'undefined' && window.supabase ? window.supabase : null,
            typeof window !== 'undefined' && window.supabaseClient ? window.supabaseClient : null
        ];
        for (const lib of possiveis) {
            if (lib && lib.createClient) return lib;
        }
        return null;
    }

    async function inicializarSupabase() {
        if (supabaseInicializado && window.supabaseClient) return true;
        if (supabaseInitPromise) return supabaseInitPromise;

        supabaseInitPromise = (async () => {
            try {
                // Verificar se ja existe um client Supabase
                if (window.supabaseClient) {
                    supabaseInicializado = true;
                    return true;
                }

                // Tentar detectar a biblioteca Supabase
                let supabaseLib = detectarSupabase();

                // Se nao encontrou, tentar carregar do CDN
                if (!supabaseLib) {
                    console.log('[SESSION] Carregando Supabase do CDN...');
                    await carregarScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
                    supabaseLib = detectarSupabase();
                }

                if (!supabaseLib) {
                    console.error('[SESSION] Nao foi possivel carregar Supabase');
                    return false;
                }

                window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    }
                });

                // Sincronizar com a sessao do Supabase Auth
                try {
                    const { data: { session } } = await window.supabaseClient.auth.getSession();
                    if (!session) {
                        // Supabase nao tem sessao, mas localStorage tem - tentar restaurar
                        console.log('[SESSION] Supabase sem sessao, mas localStorage tem');
                    }
                } catch (e) {
                    // Ignorar erro
                }

                supabaseInicializado = true;
                console.log('[SESSION] Supabase inicializado');
                return true;
            } catch (err) {
                console.error('[SESSION] Erro ao inicializar Supabase:', err);
                return false;
            }
        })();

        return supabaseInitPromise;
    }

    function carregarScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar se o script ja existe
            const existente = document.querySelector(`script[src*="supabase"]`);
            if (existente) {
                // Aguardar carregamento
                if (detectarSupabase()) {
                    resolve();
                    return;
                }
                existente.addEventListener('load', () => resolve());
                existente.addEventListener('error', () => reject());
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Falha ao carregar: ' + src));
            document.head.appendChild(script);
        });
    }

    // ===== API PUBLICA =====
    const sessaoAPI = {
        // Dados do usuario logado
        get usuario() { return window.sessaoUsuario || null; },
        get clienteId() { return window.sessaoUsuario?.cliente_id || null; },
        get usuarioId() { return window.sessaoUsuario?.usuario_id || null; },
        get nome() { return window.sessaoUsuario?.nome || ''; },
        get email() { return window.sessaoUsuario?.email || ''; },
        get nivelAcesso() { return window.sessaoUsuario?.nivel_acesso || ''; },
        get authId() { return window.sessaoUsuario?.auth_id || null; },

        // Verificar se esta autenticado
        estaAutenticado() {
            return !!window.sessaoUsuario && !!window.sessaoUsuario.auth_id;
        },

        // Obter cliente Supabase (inicializa se necessario)
        async getSupabase() {
            await inicializarSupabase();
            return window.supabaseClient;
        },

        // Verificar se Supabase esta pronto
        get supabasePronto() { return supabaseInicializado; },

        // Logout unificado
        async logout() {
            console.log('[SESSION] Realizando logout...');
            try {
                if (window.supabaseClient) {
                    await window.supabaseClient.auth.signOut();
                }
            } catch (e) {
                // Ignorar erro no signOut
            }
            limparSessao();
            window.sessaoUsuario = null;
            window.authClienteId = null;
            window.authUsuario = null;
            window.location.href = LOGIN_PAGE;
        },

        // Atualizar dados da sessao
        atualizar(dados) {
            const atual = window.sessaoUsuario || {};
            const novo = { ...atual, ...dados, login_time: new Date().toISOString() };
            window.sessaoUsuario = novo;
            localStorage.setItem(SESSAO_KEY, JSON.stringify(novo));
        },

        // Verificar permissao (admin, etc)
        temPermissao(nivel) {
            return (window.sessaoUsuario?.nivel_acesso || '').toLowerCase() === nivel.toLowerCase();
        },

        // Recarregar dados do usuario do banco
        async recarregar() {
            const sb = await inicializarSupabase();
            if (!sb) return false;

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (!session) {
                    this.logout();
                    return false;
                }

                const { data: usuario } = await window.supabaseClient
                    .from('usuarios_pg')
                    .select('*, clientes_sistema(nome, ativo, data_expiracao)')
                    .eq('auth_id', session.user.id)
                    .eq('ativo', true)
                    .single();

                if (!usuario) {
                    this.logout();
                    return false;
                }

                this.atualizar({
                    usuario_id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    cliente_id: usuario.cliente_id,
                    nivel_acesso: usuario.nivel_acesso
                });

                return true;
            } catch (e) {
                console.error('[SESSION] Erro ao recarregar:', e);
                return false;
            }
        }
    };

    // Expor globalmente
    window.sessao = sessaoAPI;
    window.sessionGuard = {
        verificar: verificarSessaoSincrona,
        inicializarSupabase: inicializarSupabase
    };

    // ===== INICIALIZACAO =====
    // 1. Verificacao sincrona IMEDIATA (antes de tudo)
    const sessaoValida = verificarSessaoSincrona();

    // 2. Se sessao valida, inicializar Supabase quando DOM estiver pronto
    if (sessaoValida && !ehPaginaPublica()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                inicializarSupabase();
            });
        } else {
            // DOM ja carregou, inicializar agora
            inicializarSupabase();
        }

        // Tambem inicializar imediatamente se Supabase ja estiver disponivel
        if (detectarSupabase()) {
            inicializarSupabase();
        }
    }

    console.log('[SESSION] session.js carregado - Sessao unificada ativa');
})();
