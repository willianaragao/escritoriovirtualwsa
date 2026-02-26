import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findTargetOrders() {
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, status, valor_total, data_pedido, clientes(nome)')
        .or('status.eq.a_receber,status.eq.pendente,status.eq.parcialmente_pago,status.eq.aguardando_pagamento');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Database Orders (Pending/Receivable) ---');
    pedidos.forEach(p => {
        console.log(`ID: ${p.id} | Status: ${p.status} | Date: ${p.data_pedido} | Client: ${p.clientes?.nome} | Total: ${p.valor_total}`);
    });

    process.exit(0);
}

findTargetOrders();
