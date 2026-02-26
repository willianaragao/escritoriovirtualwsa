import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncOrder() {
    const orderId = '1c85194e-72dc-4078-9e6c-cb225aa602bc';

    const condicoes = {
        formaPagamento: 'dinheiro',
        numeroParcelas: 3,
        dataPrimeiraParcela: '2026-02-28',
        intervaloDias: 7
    };

    console.log('Sincronizando pedido do Adriano Mercadao com os dados da imagem...');

    const { data, error } = await supabase
        .from('pedidos')
        .update({
            condicoes_pagamento: condicoes,
            numero_parcelas: 3,
            parcelas_pagas: 0 // Image shows everything "Aguardando", so 0 paid
        })
        .eq('id', orderId)
        .select();

    if (error) {
        console.error('Erro ao atualizar:', error);
    } else {
        console.log('Sucesso! Pedido atualizado:', JSON.stringify(data[0].condicoes_pagamento, null, 2));
    }
    process.exit(0);
}

syncOrder();
