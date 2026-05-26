
// ============================================================
// WHATSAPP ENVIOS - Função de Log Automático v4
// Compatível com schema misto da tabela
// ============================================================

/**
 * Registra um envio de WhatsApp na tabela whatsapp_envios
 * Envia apenas campos que existem na tabela (schema misto)
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

    // Schema da tabela (colunas que existem)
    // id, cliente_sistema_id, numero, destinatario, mensagem, status, origem, 
    // enviado_em, metadata, evolution_message_id, created_at,
    // tipo_envio, numero_destino, nome_destino, status_envio, resposta_api, 
    // erro_envio, referencia_id, referencia_tipo, codigo_rastreio, valor,
    // criado_em, atualizado_em

    const agora = new Date().toISOString();

    // Construir objeto apenas com campos existentes
    const dados = {
        // Campos obrigatórios (NO)
        cliente_sistema_id: clienteSistemaId,
        criado_em: agora,
        atualizado_em: agora
    };

    // Campos opcionais (YES) - só adicionar se tiver valor
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

    // Campos antigos (para compatibilidade)
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
                console.error('%c[WHATSAPP_LOG] ERRO RLS! Execute no SQL Editor:', 'color: red; font-weight: bold;');
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
