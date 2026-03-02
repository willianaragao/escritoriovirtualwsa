
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixData() {
    // 1. Find the order
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .ilike('clientes.nome', '%tiago%');

    if (error) {
        console.error(error);
        return;
    }

    console.log('Current found orders for Tiago:');
    console.log(JSON.stringify(pedidos, null, 2));

    // 2. Identify the order the user is talking about
    // "mandei pra janeiro"
    const orderToFix = pedidos.find(p => p.mes_referencia?.toLowerCase() === 'janeiro' || p.data_pedido?.includes('-01-'));

    if (orderToFix) {
        console.log('Fixing order:', orderToFix.id);
        // Force status to 'pago' and mes_referencia to 'Janeiro'
        const { error: updateErr } = await supabase
            .from('pedidos')
            .update({
                status: 'pago',
                mes_referencia: 'Janeiro',
                parcelas_pagas: orderToFix.numero_parcelas || 1,
                // Ensure valor_recebido matches total to avoid any logic confusion
                condicoes_pagamento: {
                    ...(orderToFix.condicoes_pagamento || {}),
                    valor_recebido: orderToFix.valor_total
                }
            })
            .eq('id', orderToFix.id);

        if (updateErr) console.error('Update Error:', updateErr);
        else console.log('Successfully updated order status and reference month.');
    } else {
        console.log('No January order found for Tiago to fix.');
    }
}
fixData();
