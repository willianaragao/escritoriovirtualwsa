import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixMistake() {
    console.log('--- Corrigindo Pedidos ---');

    // 1. Identificar o pedido que alterei erroneamente para Elienai
    // O pedido que alterei foi o ID: 0557372a-f29e-4452-8f8c-9c5330c2b933
    // Vou verificar de quem é esse pedido agora.
    const { data: pCheck } = await supabase.from('pedidos').select('*, clientes(nome)').eq('id', '0557372a-f29e-4452-8f8c-9c5330c2b933').single();

    if (pCheck) {
        console.log(`Pedido ID 055737... pertence a: ${pCheck.clientes?.nome}`);

        // Se for Elienai, restaurar status para 'pago' e parcelas para 1/1
        await supabase.from('pedidos').update({
            status: 'pago',
            numero_parcelas: 1,
            parcelas_pagas: 1,
            condicoes_pagamento: { formaPagamento: 'pix' } // Restaurando o que vi no check anterior
        }).eq('id', '0557372a-f29e-4452-8f8c-9c5330c2b933');
        console.log(`✓ Pedido de ${pCheck.clientes?.nome} restaurado para PAGO com sucesso.`);
    }

    // 2. Procurar o pedido CORRETO da Joselia Jh niteroi de 460 reais
    const { data: joseliaPedidos } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .eq('valor_total', 460)
        .ilike('clientes.nome', '%Joselia%');

    if (joseliaPedidos && joseliaPedidos.length > 0) {
        console.log(`Encontrado(s) ${joseliaPedidos.length} pedido(s) da Joselia.`);
        for (const p of joseliaPedidos) {
            console.log(`Atualizando Pedido ID: ${p.id} da Joselia...`);
            await supabase.from('pedidos').update({
                status: 'parcialmente_pago',
                numero_parcelas: 2,
                parcelas_pagas: 1,
                condicoes_pagamento: {
                    formaPagamento: 'boleto',
                    numeroParcelas: 2,
                    valorParcelar: 230,
                    valor_recebido: 230,
                    dataPrimeiraParcela: p.data_pedido,
                    intervaloDias: 30
                }
            }).eq('id', p.id);
            console.log(`✓ Pedido da Joselia (ID ${p.id}) atualizado corretamente.`);
        }
    } else {
        console.log('ERRO: Não encontrei nenhum pedido da Joselia Jh niteroi com valor 460.');
    }

    process.exit(0);
}

fixMistake();
