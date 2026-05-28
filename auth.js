// ==========================================
// AUTH.JS - Sistema Multi-Entidade
// Versão FINAL: colunas auth_id + cliente_id, ANON KEY CORRETA
// ==========================================

const SUPABASE_URL = 'https://aqrvozmxlcgrllclceke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcnZvem14bGNncmxsY2xjZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTk0MDEsImV4cCI6MjA5MTgzNTQwMX0.6CL3-1dU6WUT4EbJ0UfvmLFj6jGPnT9Avc743WrNiCA';

window.supabaseClient = null;
window.authUsuario = null;
window.authClienteId = null;
window.authIsRedirecting = false;

// ==========================================
// DETECTAR OBJETO SUPABASE
// ==========================================
function detectarSupabase() {
    const possiveis = [
        typeof supabase !== 'undefined' ? supabase : null,
        typeof window !== 'undefined' && window.supabase ? window.supabase : null,
        typeof window !== 'undefined' && window.supabaseClient ? window.supabaseClient : null,
        typeof window !== 'undefined' && window.createClient ? { createClient: window.createClient } : null
    ];
    for (let i = 0; i < possiveis.length; i++) {
        if (possiveis[i] && possiveis[i].createClient) {
            console.log('[AUTH] ✅ Supabase detectado na posição', i);
            return possiveis[i];
        }
    }
    return null;
}

// ==========================================
// CARREGAR SUPABASE COM FALLBACK CDN
// ==========================================
function carregarSupabaseCDN() {
    return new Promise((resolve) => {
        const existente = detectarSupabase();
        if (existente) { resolve(existente); return; }

        console.log('[AUTH] ⏳ Carregando Supabase do jsdelivr...');
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.8/dist/umd/supabase.min.js';
        script1.crossOrigin = 'anonymous';
        script1.onload = () => {
            const lib = detectarSupabase();
            if (lib) { resolve(lib); }
            else {
                const script2 = document.createElement('script');
                script2.src = 'https://unpkg.com/@supabase/supabase-js@2.39.8/dist/umd/supabase.min.js';
                script2.crossOrigin = 'anonymous';
                script2.onload = () => resolve(detectarSupabase() || null);
                script2.onerror = () => resolve(null);
                document.head.appendChild(script2);
            }
        };
        script1.onerror = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://unpkg.com/@supabase/supabase-js@2.39.8/dist/umd/supabase.min.js';
            script2.crossOrigin = 'anonymous';
            script2.onload = () => resolve(detectarSupabase() || null);
            script2.onerror = () => resolve(null);
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    });
}

// ==========================================
// INICIALIZAR SUPABASE
// ==========================================
function inicializarSupabase(supabaseLib) {
    try {
        if (!supabaseLib || !supabaseLib.createClient) return false;
        window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
        console.log('[AUTH] ✅ Supabase client criado');
        return true;
    } catch (err) {
        console.error('[AUTH] ❌ Erro ao criar client:', err);
        return false;
    }
}

// ==========================================
// VERIFICAÇÃO DE SESSÃO
// ==========================================
async function verificarSessao() {
    try {
        if (!window.supabaseClient) return null;
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) { console.error('[AUTH] ❌ Erro sessão:', error); return null; }
        if (!session) { console.log('[AUTH] ℹ️ Sem sessão'); return null; }
        console.log('[AUTH] ✅ Sessão ativa:', session.user.email);
        return session;
    } catch (err) { console.error('[AUTH] ❌ Erro:', err); return null; }
}

// ==========================================
// CARREGAR DADOS DO USUÁRIO LOGADO
// ==========================================
async function carregarUsuarioLogado() {
    try {
        const session = await verificarSessao();
        if (!session) {
            console.log('[AUTH] ℹ️ Sem sessão');
            return null;
        }

        const authUserId = session.user.id;
        const authUserEmail = session.user.email;

        console.log('[AUTH] Buscando usuário com auth_id:', authUserId);

        const { data: usuario, error: erroUsuario } = await window.supabaseClient
            .from('usuarios_pg')
            .select('*, clientes_sistema(nome)')
            .eq('auth_id', authUserId)
            .eq('ativo', true)
            .single();

        if (erroUsuario || !usuario) {
            console.error('[AUTH] ❌ Usuário não encontrado. Erro:', erroUsuario?.message || 'Nenhum dado');
            return null;
        }

        window.authClienteId = usuario.cliente_id;
        window.authUsuario = usuario;

        const nomeUsuario = usuario.nome || authUserEmail;
        const nomeCliente = usuario.clientes_sistema?.nome || '';

        atualizarHeaderUI(nomeUsuario, nomeCliente);

        console.log('[AUTH] ✅ Usuário:', nomeUsuario, '| Cliente:', nomeCliente, '| cliente_id:', window.authClienteId);

        return usuario;
    } catch (err) {
        console.error('[AUTH] ❌ Erro ao carregar usuário:', err);
        return null;
    }
}

// ==========================================
// ATUALIZAR UI DO HEADER
// ==========================================
function atualizarHeaderUI(nomeUsuario, nomeCliente) {
    const userInfoEl = document.getElementById('userInfo');
    if (!userInfoEl) return;
    if (nomeCliente) {
        userInfoEl.innerHTML = `👤 ${nomeUsuario} <span class="cliente-nome">(${nomeCliente})</span>`;
    } else {
        userInfoEl.innerHTML = `👤 ${nomeUsuario}`;
    }
}

// ==========================================
// VERIFICAR AUTENTICAÇÃO
// ==========================================
async function verificarAutenticacao() {
    try {
        console.log('[AUTH] Verificando autenticação...');
        const usuario = await carregarUsuarioLogado();
        if (!usuario) { console.log('[AUTH] ❌ Não autenticado'); return false; }
        console.log('[AUTH] ✅ Autenticação OK');
        return true;
    } catch (err) { console.error('[AUTH] ❌ Erro:', err); return false; }
}

// ==========================================
// LOGOUT
// ==========================================
async function fazerLogout() {
    try {
        console.log('[AUTH] 🚪 Logout...');
        if (window.supabaseClient) { await window.supabaseClient.auth.signOut(); }
        window.authUsuario = null;
        window.authClienteId = null;
        window.authIsRedirecting = false;
        console.log('[AUTH] ✅ Logout realizado');
        const loginUrl = typeof v !== 'undefined' ? v('login.html') : 'login.html';
        window.location.href = loginUrl;
    } catch (err) {
        console.error('[AUTH] ❌ Erro no logout:', err);
    }
}
window.fazerLogout = fazerLogout;

// ==========================================
// REDIRECIONAMENTO INTELIGENTE
// ==========================================
async function gerenciarRedirecionamento() {
    if (window.authIsRedirecting) {
        console.log('[AUTH] Redirect já em andamento, aguardando...');
        return true;
    }

    const paginaAtual = window.location.pathname;
    const urlCompleta = window.location.href;

    const ehPaginaLogin = paginaAtual.includes('login.html') || urlCompleta.includes('login.html');
    const ehPaginaDashboard = paginaAtual.includes('dashboard.html') || urlCompleta.includes('dashboard.html');

    const ehPaginaPublica = ehPaginaLogin || 
                           paginaAtual.includes('solicitacao-entrega.html') || 
                           urlCompleta.includes('solicitacao-entrega.html') ||
                           paginaAtual.includes('coblive.html') ||
                           urlCompleta.includes('coblive.html');

    console.log('[AUTH] Página:', paginaAtual, '| Login?', ehPaginaLogin, '| Dashboard?', ehPaginaDashboard, '| Pública?', ehPaginaPublica);

    if (ehPaginaLogin) {
        const autenticado = await verificarAutenticacao();
        if (autenticado) {
            console.log('[AUTH] 🔄 Logado na login → dashboard');
            window.authIsRedirecting = true;
            const dashboardUrl = typeof v !== 'undefined' ? v('dashboard.html') : 'dashboard.html';
            window.location.replace(dashboardUrl);
            return true;
        }
        return false;
    }

    if (ehPaginaDashboard) {
        const autenticado = await verificarAutenticacao();
        if (!autenticado) {
            console.log('[AUTH] 🔄 Não logado no dashboard → login');
            window.authIsRedirecting = true;
            const loginUrl = typeof v !== 'undefined' ? v('login.html') : 'login.html';
            window.location.replace(loginUrl);
            return true;
        }
        return false;
    }

    if (!ehPaginaPublica) {
        const autenticado = await verificarAutenticacao();
        if (!autenticado) {
            console.log('[AUTH] 🔄 Não logado em página protegida → login');
            window.authIsRedirecting = true;
            const loginUrl = typeof v !== 'undefined' ? v('login.html') : 'login.html';
            window.location.replace(loginUrl);
            return true;
        }
    }

    return false;
}

// ==========================================
// TOAST GLOBAL
// ==========================================
function mostrarToast(mensagem, tipo) {
    const antigo = document.getElementById('toast-global');
    if (antigo) antigo.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; padding: 16px 28px;
        border-radius: 14px; color: white; font-weight: 600;
        box-shadow: 0 15px 40px rgba(0,0,0,0.3); z-index: 9999;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateX(400px); font-family: 'Segoe UI', sans-serif;
    `;
    const cores = {
        success: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    toast.style.background = cores[tipo] || cores.info;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[AUTH] 🚀 auth.js v2026-05-07-1735-KEY-CORRETA...');

    const supabaseLib = await carregarSupabaseCDN();
    if (!supabaseLib) {
        alert('Erro ao carregar Supabase. Recarregue (Ctrl+Shift+R).');
        return;
    }

    if (!inicializarSupabase(supabaseLib)) return;

    const foiRedirecionado = await gerenciarRedirecionamento();
    if (!foiRedirecionado) {
        console.log('[AUTH] Não houve redirecionamento, carregando usuário...');
        await carregarUsuarioLogado();
    }
});

console.log('[AUTH] 📄 auth.js carregado (v2026-05-07-1735-KEY-CORRETA)');
