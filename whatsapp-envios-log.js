
// ============================================================
// WHATSAPP ENVIOS - Função de Log Automático v5
// Timeout 60s + Botão Reenviar
// ============================================================

// Constantes
const EVOLUTION_API_URL = 'https://evolution-api-o12a.onrender.com';
const EVOLUTION_API_KEY = '8117861c85b102b1fafd496132bba462';
const EVOLUTION_INSTANCE = 'pingodegente';
const TIMEOUT_EVOLUTION = 60000; // 60 segundos

// Cache de mensagens para reenvio
const mensagensCache = {};

/**
 * Registra um envio de WhatsApp na tabela whatsapp_envios
 */
async function registrarEnvioWhatsApp(params) {
    if (!window.supabaseClient) {
        console.warn('[WHATSAPP_LOG] supabaseClient não disponível');
        return null;
    }

    const clienteSistemaId = window.authClienteId || window.clienteSistemaId;
    if (!clienteSistemaId) {
        console.warn('[WHATSAPP_LOG] clienteSistemaId não identificado');
        return null;
    }

    const agora = new Date().toISOString();

    const dados = {
        cliente_sistema_id: clienteSistemaId,
        criado_em: agora,
        atualizado_em: agora
    };

    if (params.tipo_envio) dados.tipo_envio = params.tipo_envio;
    if (params.origem) dados.origem = params.origem;
    if (params.numero_destino) dados.numero_destino = params.numero_destino;
    if (params.nome_destino) dados.nome_destino = params.nome_destino;
    if (params.mensagem) dados.mensagem = params.mensagem.substring(0, 2000);
    if (params.status_envio) dados.status_envio = params.status_envio;
    if (params.resposta_api) dados.resposta_api = params.resposta_api;
    if (params.erro_envio) dados.erro_envio = params.erro_envio;
    if (params.referencia_id) dados.referencia_id = params.referencia_id;
    if (params.referencia_tipo) dados.referencia_tipo = params.referencia_tipo;
    if (params.codigo_rastreio) dados.codigo_rastreio = params.codigo_rastreio;
    if (params.valor !== null && params.valor !== undefined) dados.valor = params.valor;

    // Campos antigos (compatibilidade)
    if (params.numero_destino) dados.numero = params.numero_destino;
    if (params.nome_destino) dados.destinatario = params.nome_destino;
    if (params.status_envio) dados.status = params.status_envio;
    dados.enviado_em = agora;
    if (params.resposta_api) dados.metadata = params.resposta_api;
    dados.created_at = agora;

    try {
        const { data, error } = await window.supabaseClient
            .from('whatsapp_envios')
            .insert([dados])
            .select()
            .single();

        if (error) {
            console.error('[WHATSAPP_LOG] Erro ao registrar:', error);
            if (error.code === '42501') {
                console.error('%c[WHATSAPP_LOG] ERRO RLS! Execute:', 'color: red; font-weight: bold;');
                console.error('%cCREATE POLICY "Allow all authenticated" ON public.whatsapp_envios FOR ALL TO authenticated USING (true) WITH CHECK (true);', 'color: cyan;');
            }
            return null;
        }

        console.log('[WHATSAPP_LOG] ✅ Registrado com sucesso. ID:', data.id);
        return data;
    } catch (e) {
        console.error('[WHATSAPP_LOG] Erro inesperado:', e);
        return null;
    }
}

/**
 * Envia mensagem WhatsApp via Evolution API (com timeout 60s)
 */
async function enviarWhatsAppEvolution(numero, texto, timeoutMs = TIMEOUT_EVOLUTION) {
    let numeroLimpo = numero.toString().replace(/\D/g, '');
    if (!numeroLimpo.startsWith('55')) {
        numeroLimpo = '55' + numeroLimpo;
    }

    // Tentativa 1
    let resultado = await _enviarWhatsAppEvolution(numeroLimpo, texto, timeoutMs);

    // Se timeout, tentar mais uma vez
    if (!resultado.sucesso && resultado.erro === 'Timeout') {
        console.log('[EVOLUTION] Timeout na tentativa 1, aguardando 3s para retry...');
        await new Promise(r => setTimeout(r, 3000));
        resultado = await _enviarWhatsAppEvolution(numeroLimpo, texto, timeoutMs);
    }

    return resultado;
}

async function _enviarWhatsAppEvolution(numeroLimpo, texto, timeoutMs) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(EVOLUTION_API_URL + '/message/sendText/' + EVOLUTION_INSTANCE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify({
                number: numeroLimpo,
                text: texto
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('[EVOLUTION] Response:', JSON.stringify(data));

        if (!response.ok) {
            if (data.response && data.response.message && Array.isArray(data.response.message)) {
                const msg = data.response.message[0];
                if (msg && msg.exists === false) {
                    return { sucesso: false, erro: 'NÚMERO_INVÁLIDO', dados: data, mensagem: 'Este número não está cadastrado no WhatsApp: ' + msg.number };
                }
            }

            const isPrismaError = data.response && data.response.message && Array.isArray(data.response.message) &&
                data.response.message.some(m => typeof m === 'string' && m.includes('Prisma'));

            if (isPrismaError) {
                return { sucesso: true, dados: data, warning: 'Erro interno do servidor (Prisma), mas mensagem foi enviada' };
            }

            return { sucesso: false, erro: data.error || 'HTTP ' + response.status, dados: data };
        }

        return { sucesso: true, dados: data };
    } catch (erro) {
        if (erro.name === 'AbortError') {
            console.log('[EVOLUTION] Timeout (' + timeoutMs + 'ms)');
            return { sucesso: false, erro: 'Timeout', dados: { status: 'TIMEOUT' } };
        }
        console.error('[EVOLUTION] Erro:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

/**
 * Wrapper para envio de PIX via WhatsApp com log automático
 */
async function enviarPixWhatsAppComLog(cliente, linkPagamento, resultadoEnvio, vendaId, valor) {
    const numeroLimpo = (cliente.whatsapp || '').replace(/\D/g, '');
    const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo;

    let status = 'falha';
    let erro = null;
    let resposta = null;

    if (resultadoEnvio.sucesso) {
        status = 'enviado';
        resposta = resultadoEnvio.dados;
    } else if (resultadoEnvio.erro === 'NÚMERO_INVÁLIDO') {
        status = 'numero_invalido';
        erro = resultadoEnvio.mensagem || 'Número não cadastrado no WhatsApp';
    } else if (resultadoEnvio.erro === 'Timeout') {
        status = 'timeout';
        erro = 'Timeout na API do WhatsApp';
    } else {
        status = 'falha';
        erro = resultadoEnvio.erro || 'Erro desconhecido';
        resposta = resultadoEnvio.dados;
    }

    return await registrarEnvioWhatsApp({
        tipo_envio: 'pix_cobranca',
        origem: 'coblive',
        numero_destino: numeroFormatado,
        nome_destino: cliente.nome,
        mensagem: linkPagamento,
        status_envio: status,
        resposta_api: resposta,
        erro_envio: erro,
        referencia_id: vendaId,
        referencia_tipo: 'venda',
        valor: valor
    });
}

/**
 * Wrapper para envio de rastreamento via WhatsApp com log automático
 */
async function enviarRastreamentoWhatsAppComLog(cliente, sol, resultadoEnvio) {
    const numeroLimpo = (cliente.whatsapp || '').replace(/\D/g, '');
    const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo;

    let status = 'falha';
    let erro = null;
    let resposta = null;

    if (resultadoEnvio.sucesso) {
        status = 'enviado';
        resposta = resultadoEnvio.dados;
    } else if (resultadoEnvio.erro === 'NÚMERO_INVÁLIDO') {
        status = 'numero_invalido';
        erro = resultadoEnvio.mensagem || 'Número não cadastrado no WhatsApp';
    } else if (resultadoEnvio.erro === 'Timeout') {
        status = 'timeout';
        erro = 'Timeout na API do WhatsApp';
    } else {
        status = 'falha';
        erro = resultadoEnvio.erro || 'Erro desconhecido';
        resposta = resultadoEnvio.dados;
    }

    return await registrarEnvioWhatsApp({
        tipo_envio: 'rastreamento',
        origem: 'rastreamento',
        numero_destino: numeroFormatado,
        nome_destino: cliente.nome,
        mensagem: sol.codigo_rastreio,
        status_envio: status,
        resposta_api: resposta,
        erro_envio: erro,
        referencia_id: sol.id,
        referencia_tipo: 'solicitacao',
        codigo_rastreio: sol.codigo_rastreio
    });
}

/**
 * Função para reenviar mensagem WhatsApp (usada pelo botão Reenviar)
 * @param {string} logId - ID do registro na tabela whatsapp_envios
 * @param {string} numero - Número de telefone
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - Tipo: 'pix' ou 'rastreamento'
 */
async function reenviarWhatsApp(logId, numero, mensagem, tipo) {
    console.log('[REENVIAR] Reenviando mensagem. Log ID:', logId);

    const resultado = await enviarWhatsAppEvolution(numero, mensagem);

    if (resultado.sucesso) {
        // Atualizar status no banco para "reenviado"
        if (window.supabaseClient && logId) {
            await window.supabaseClient
                .from('whatsapp_envios')
                .update({ 
                    status_envio: 'reenviado',
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', logId);
        }
        return { sucesso: true, mensagem: 'Mensagem reenviada com sucesso!' };
    } else {
        return { 
            sucesso: false, 
            erro: resultado.erro, 
            mensagem: resultado.erro === 'Timeout' 
                ? 'Timeout novamente. Tente reenviar mais tarde.' 
                : 'Erro ao reenviar: ' + resultado.erro 
        };
    }
}
