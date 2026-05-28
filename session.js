// ==========================================
// SESSION.JS - Verificacao sincrona de login
// Apenas verifica localStorage - NAO inicializa Supabase
// O auth.js ja cuida da inicializacao do Supabase
// v2.0 - Sem inicializacao de Supabase (evita duplicacao)
// ==========================================
(function(){
    'use strict';
    const SESSAO_KEY='usuarioLogado';
    const LOGIN_PAGE='login.html';
    const path=window.location.pathname.toLowerCase();
    const href=window.location.href.toLowerCase();
    const paginasPublicas=['login.html','solicitacao-entrega.html','solicitacoes.html','solicitacoes1.html','coblive.html','pix-pagamento.html','pix-sucesso.html','links.html','index.html','index2.html'];
    function ehPaginaPublica(){if(path==='/'||path.endsWith('/index.html')||path.endsWith('/index2.html'))return true;for(const p of paginasPublicas){if(path.includes(p)||href.includes(p))return true}return false}
    function verificarSessaoSincrona(){if(ehPaginaPublica())return true;try{const s=localStorage.getItem(SESSAO_KEY);if(!s){window.location.href=LOGIN_PAGE;return false}const d=JSON.parse(s);if(!d||!d.auth_id||!d.usuario_id){localStorage.removeItem(SESSAO_KEY);window.location.href=LOGIN_PAGE;return false}if(d.login_time){const t=new Date(d.login_time).getTime();if((Date.now()-t)>86400000){localStorage.removeItem(SESSAO_KEY);window.location.href=LOGIN_PAGE;return false}}window.sessaoUsuario=d;window.authClienteId=d.cliente_id;return true}catch(e){localStorage.removeItem(SESSAO_KEY);window.location.href=LOGIN_PAGE;return false}}
    verificarSessaoSincrona();
})();
