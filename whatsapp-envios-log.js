
// ============================================================
// WHATSAPP ENVIOS - Função de Log Automático v2
// Registra na tabela whatsapp_envios automaticamente
// ============================================================

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

    const dados = {
        cliente_sistema_id: clienteSistemaId,
        tipo_envio: params.tipo_envio,
        origem: params.origem,
        numero_destino: params.numero_destino,
        nome_destino: params.nome_destino || null,
        mensagem: params.mensagem ? params.mensagem.substring(0, 2000) : null,
        status_envio: params.status_envio,
        resposta_api: params.resposta_api ? JSON.stringify(params.resposta_api).substring(0, 5000) : null,
        erro_envio: params.erro_envio || null,
        referencia_id: params.referencia_id || null,
        referencia_tipo: params.referencia_tipo || null,
        codigo_rastreio: params.codigo_rastreio || null,
        valor: params.valor || null,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
    };

    try {
        const { data, error } = await window.supabaseClient
            .from('whatsapp_envios')
            .insert([dados])
            .select()
            .single();

        if (error) {
            console.error('[WHATSAPP_LOG] Erro ao registrar:', error);

            // Se for erro de RLS (403), mostrar instrução clara
            if (error.code === '42501' || error.message.includes('row-level security')) {
                console.error('%c[WHATSAPP_LOG] ERRO RLS DETECTADO!', 'color: red; font-size: 14px; font-weight: bold;');
                console.error('%cA tabela whatsapp_envios precisa de políticas RLS.', 'color: orange;');
                console.error('%cExecute no SQL Editor do Supabase:', 'color: orange;');
                console.error('%cALTER TABLE public.whatsapp_envios ENABLE ROW LEVEL SECURITY;', 'color: cyan;');
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
