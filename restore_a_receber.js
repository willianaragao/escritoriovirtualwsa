import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restoreOrders() {
    const A_RECEBER_STATUSES = ['aguardando_pagamento', 'a_receber', 'parcialmente_pago', 'aguardando pagamento'];

    console.log('--- Restaurando Pedidos a Receber ---');

    // Find orders that have 0 or null parcelas but are in a pending state
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, status, numero_parcelas, clientes(nome)')
        .in('status', A_RECEBER_STATUSES);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    const toRestore = pedidos.filter(p => !p.numero_parcelas || p.numero_parcelas === 0);

    console.log(`Found ${toRestore.length} orders to restore.`);

    for (const p of toRestore) {
        console.log(`Restoring ID: ${p.id}, Client: ${p.clientes?.nome}`);
        const { error: updErr } = await supabase.from('pedidos')
            .update({
                numero_parcelas: 1,
                parcelas_pagas: 0 // Resetting to 0 as they are pending
            })
            .eq('id', p.id);

        if (updErr) console.error(`Error restoring ${p.id}:`, updErr);
    }

    console.log('--- Restauração Concluída ---');
    process.exit(0);
}

restoreOrders();
