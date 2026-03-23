import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAdriano() {
    const orderId = '1c85194e-72dc-4078-9e6c-cb225aa602bc';
    const totalOrder = 3770;
    const payment1 = 1270;
    const payment2 = 1250;
    const totalPaid = payment1 + payment2; // 2520

    console.log(`Fixing order ${orderId}...`);
    console.log(`Total Paid intended: ${totalPaid}`);

    const { data: currentOrder } = await supabase.from('pedidos').select('*').eq('id', orderId).single();

    if (currentOrder) {
        const condicoes = {
            ...currentOrder.condicoes_pagamento,
            valor_recebido: totalPaid,
            formaPagamento: currentOrder.condicoes_pagamento?.formaPagamento || 'dinheiro',
            numeroParcelas: currentOrder.condicoes_pagamento?.numeroParcelas || 3,
            dataPrimeiraParcela: currentOrder.condicoes_pagamento?.dataPrimeiraParcela || '2026-02-28',
            intervaloDias: currentOrder.condicoes_pagamento?.intervaloDias || 7
        };

        const precoParc = totalOrder / (condicoes.numeroParcelas || 1);
        const calculatedPagas = Math.floor(totalPaid / precoParc);

        const { error } = await supabase
            .from('pedidos')
            .update({
                condicoes_pagamento: condicoes,
                parcelas_pagas: calculatedPagas,
                status: 'parcialmente_pago', // Still partially paid since 2520 < 3770
                mes_referencia: 'Fevereiro' // Keeping it in February as per user's context
            })
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order:', error);
        } else {
            console.log('Order successfully updated!');
            console.log('New stats:');
            console.log(`- Valor Recebido: ${totalPaid}`);
            console.log(`- Valor Restante: ${totalOrder - totalPaid}`);
            console.log(`- Parcelas Pagas: ${calculatedPagas}`);
        }
    } else {
        console.log('Order not found!');
    }

    process.exit(0);
}

fixAdriano();
