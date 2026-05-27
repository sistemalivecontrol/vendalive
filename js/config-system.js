// ==========================================
// CONFIG-SYSTEM.JS - Sistema de Configuracoes Centralizado
// Gerencia todas as configuracoes por cliente_id no localStorage
// v1.0 - Configuracoes dinamicas sem editar codigo
// ==========================================

(function() {
    'use strict';

    const CONFIG_KEY = 'vendalive_config';

    // Configuracoes padrao
    const DEFAULTS = {
        // WhatsApp / Evolution API
        evolution_api_url: 'https://evolution-api-o12a.onrender.com',
        evolution_api_key: '',
        evolution_instance: 'pingodegente',

        // Supabase (opcional - para migracao)
        supabase_url: 'https://aqrvozmxlcgrllclceke.supabase.co',
        supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcnZvem14bGNncmxsY2xjZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTk0MDEsImV4cCI6MjA5MTgzNTQwMX0.6CL3-1dU6WUT4EbJ0UfvmLFj6jGPnT9Avc743WrNiCA',

        // Dados da Loja
        loja_nome: 'VendaLive',
        loja_telefone: '',
        loja_instagram: '',
        loja_endereco: '',

        // Taxas padrao
        taxa_percentual_padrao: '3.49',
        taxa_fixa_padrao: '0.49',

        // Webhooks
        webhook_status: ''
    };

    // ============ FUNCOES PUBLICAS ============

    // Obter cliente_id atual
    function getClienteId() {
        try {
            var sessao = localStorage.getItem('usuarioLogado');
            if (sessao) {
                var dados = JSON.parse(sessao);
                return dados.cliente_id || 'default';
            }
        } catch(e) {}
        return 'default';
    }

    // Chave unica para este cliente
    function getConfigKey() {
        return CONFIG_KEY + '_' + getClienteId();
    }

    // Carregar todas as configuracoes
    function loadAll() {
        try {
            var salvo = localStorage.getItem(getConfigKey());
            if (salvo) {
                return Object.assign({}, DEFAULTS, JSON.parse(salvo));
            }
        } catch(e) {
            console.error('[CONFIG] Erro ao carregar:', e);
        }
        return Object.assign({}, DEFAULTS);
    }

    // Salvar todas as configuracoes
    function saveAll(config) {
        try {
            localStorage.setItem(getConfigKey(), JSON.stringify(config));
            console.log('[CONFIG] Configuracoes salvas para cliente:', getClienteId());
            return true;
        } catch(e) {
            console.error('[CONFIG] Erro ao salvar:', e);
            return false;
        }
    }

    // Obter uma configuracao especifica
    function get(key) {
        var config = loadAll();
        return config[key] !== undefined ? config[key] : DEFAULTS[key];
    }

    // Definir uma configuracao
    function set(key, value) {
        var config = loadAll();
        config[key] = value;
        return saveAll(config);
    }

    // Resetar para padroes
    function reset() {
        localStorage.removeItem(getConfigKey());
        console.log('[CONFIG] Configuracoes resetadas para padroes');
        return true;
    }

    // Verificar se configuracoes existem
    function exists() {
        return localStorage.getItem(getConfigKey()) !== null;
    }

    // Aplicar configuracoes as variaveis globais
    function applyGlobals() {
        var config = loadAll();

        // Evolution API
        window.EVOLUTION_API_URL = config.evolution_api_url;
        window.EVOLUTION_API_KEY = config.evolution_api_key;
        window.EVOLUTION_INSTANCE = config.evolution_instance;

        console.log('[CONFIG] Configuracoes aplicadas. Instancia:', config.evolution_instance);
    }

    // ============ EXPORTAR ============
    window.VendaLiveConfig = {
        get: get,
        set: set,
        getAll: loadAll,
        saveAll: saveAll,
        reset: reset,
        exists: exists,
        applyGlobals: applyGlobals,
        getClienteId: getClienteId,
        defaults: DEFAULTS
    };

    // Aplicar imediatamente (nao esperar DOMContentLoaded)
    applyGlobals();

    console.log('[CONFIG] Config-system.js carregado. Instancia:', window.EVOLUTION_INSTANCE);
})();
