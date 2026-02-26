import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncJoselia() {
    console.log('--- Sincronizando Pedido da Joselia Jh niteroi ---');

    // Order info
    const pedidoId = '0557372a-f29e-4452-8f8c-9c5330c2b933';

    /*
      Plan: 
      - Status: "parcialmente_pago" (as one parcel of 230 is paid, but the total is 460)
      - numero_parcelas: 2
      - parcelas_pagas: 1
      - condicoes_pagamento: 2 parcels of 230 via boleto.
    */

    const { error } = await supabase.from('pedidos').update({
        status: 'parcialmente_pago',
        numero_parcelas: 2,
        parcelas_pagas: 1,
        condicoes_pagamento: {
            formaPagamento: 'boleto',
            numeroParcelas: 2,
            valorParcela: 230,
            valor_recebido: 230,
            dataPrimeiraParcela: '2026-02-23', // Assuming same day as order for the first one
            intervaloDias: 30
        }
    }).eq('id', pedidoId);

    if (error) {
        console.error('Erro ao atualizar:', error);
    } else {
        console.log('✓ Pedido da Joselia atualizado com sucesso!');
        console.log('  Status: Parcialmente Pago');
        console.log('  Parcelas: 2 (1 Paga - R$ 230,00 | 1 Pendente - R$ 230,00)');
    }

    process.exit(0);
}

syncJoselia();
