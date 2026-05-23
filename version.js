// version.js - Controle de versão com auto-incremento
// A versão é gerada automaticamente pela data/hora do build
// NÃO EDITE MANUALMENTE - a versão muda sozinha a cada deploy

(function() {
    // ============================================
    // AUTO-VERSÃO: Gera versão única automaticamente
    // ============================================
    // Gera versão baseada em: ANO-MES-DIA-HORA-MINUTO
    // Exemplo: v2026-05-05-1437 (14:37)
    // Cada vez que o arquivo é carregado, se o minuto mudou,
    // a versão é diferente, forçando cache refresh

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');

    // Versão automática: v2026-05-05-1437
    const APP_VERSION = 'v' + ano + '-' + mes + '-' + dia + '-' + hora + minuto;
    const BUILD_DATE = ano + '-' + mes + '-' + dia;
    const BUILD_TIME = hora + ':' + minuto;

    // ============================================
    // FUNÇÃO v() - Adiciona versão às URLs
    // ============================================
    window.v = function(url) {
        if (!url || typeof url !== 'string') return url;
        // Se já tem ?, adiciona &v=...
        if (url.includes('?')) {
            // Remove versão antiga se existir (evita duplicação)
            url = url.replace(/[&?]v=[^&]*/g, '');
            return url + '&v=' + APP_VERSION;
        }
        return url + '?v=' + APP_VERSION;
    };

    // ============================================
    // DETECÇÃO DE NOVA VERSÃO + AUTO-RELOAD
    // ============================================
    const storedVersion = localStorage.getItem('app_version');
    const storedDate = localStorage.getItem('app_version_date');

    if (storedVersion && storedVersion !== APP_VERSION) {
        console.log('[VERSION] 🔄 Nova versão detectada: ' + APP_VERSION + ' (anterior: ' + storedVersion + ')');

        // Se a versão mudou no mesmo dia, recarrega silenciosamente
        // Se mudou de dia, mostra notificação
        if (storedDate && storedDate === BUILD_DATE) {
            console.log('[VERSION] Mesmo dia - reload silencioso em 3s...');
            setTimeout(function() {
                window.location.reload(true); // true = força servidor
            }, 3000);
        } else {
            console.log('[VERSION] Novo dia - mostrando notificação');
            mostrarNotificacaoNovaVersao(storedVersion, APP_VERSION);
        }
    }

    // Salva versão atual
    localStorage.setItem('app_version', APP_VERSION);
    localStorage.setItem('app_version_date', BUILD_DATE);

    // ============================================
    // NOTIFICAÇÃO VISUAL (apenas quando muda de dia)
    // ============================================
    function mostrarNotificacaoNovaVersao(versaoAntiga, versaoNova) {
        // Cria o elemento de notificação
        var notif = document.createElement('div');
        notif.id = 'version-notification';
        notif.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px 25px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 99999;
                max-width: 350px;
                font-family: 'Segoe UI', sans-serif;
                animation: slideInVersion 0.5s ease;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <span style="font-size: 28px;">🚀</span>
                    <div>
                        <div style="font-weight: 700; font-size: 16px;">Nova versão disponível!</div>
                        <div style="font-size: 12px; opacity: 0.8;">${versaoAntiga} → ${versaoNova}</div>
                    </div>
                </div>
                <p style="font-size: 14px; margin-bottom: 15px; line-height: 1.5;">
                    O sistema foi atualizado. Clique abaixo para recarregar e obter as últimas melhorias.
                </p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.location.reload(true);" style="
                        flex: 1;
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    ">🔄 Recarregar Agora</button>
                    <button onclick="document.getElementById('version-notification').remove();" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 1px solid rgba(255,255,255,0.3);
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    ">Depois</button>
                </div>
            </div>
            <style>
                @keyframes slideInVersion {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        // Aguarda DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(notif);
            });
        } else {
            document.body.appendChild(notif);
        }
    }

    // ============================================
    // EXPOSE GLOBAIS
    // ============================================
    window.APP_VERSION = APP_VERSION;
    window.BUILD_DATE = BUILD_DATE;
    window.BUILD_TIME = BUILD_TIME;

    // ============================================
    // LOGS
    // ============================================
    console.log('%c[VERSION] ' + APP_VERSION, 'color: #667eea; font-weight: bold; font-size: 14px;');
    console.log('[VERSION] Build: ' + BUILD_DATE + ' ' + BUILD_TIME);
    console.log('[VERSION] Auto-incremento ativo - versão muda a cada minuto');

})();
