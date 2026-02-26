import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function finalFix() {
    console.log('--- Corrigindo Erro de Atribuição ---');

    // 1. Elienai (ID: 0557372a-f29e-4452-8f8c-9c5330c2b933) -> Pago
    await supabase.from('pedidos').update({
        status: 'pago',
        numero_parcelas: 1,
        parcelas_pagas: 1,
        condicoes_pagamento: { formaPagamento: 'pix' }
    }).eq('id', '0557372a-f29e-4452-8f8c-9c5330c2b933');
    console.log('✓ Pedido da Elienai restaurado para PAGO (Total).');

    // 2. Joselia Jh niteroi (ID: a28641c2-56f2-48fc-a194-8da42c69297a) -> Parcialmente Pago
    await supabase.from('pedidos').update({
        status: 'parcialmente_pago',
        numero_parcelas: 2,
        parcelas_pagas: 1,
        condicoes_pagamento: {
            formaPagamento: 'boleto',
            numeroParcelas: 2,
            valorParcela: 230,
            valor_recebido: 230,
            dataPrimeiraParcela: '2026-02-23',
            intervaloDias: 30
        }
    }).eq('id', 'a28641c2-56f2-48fc-a194-8da42c69297a');
    console.log('✓ Pedido da Joselia atualizado para PARCIALMENTE PAGO (1/2 pago).');

    process.exit(0);
}

finalFix();
