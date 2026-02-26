import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHiddenOrders() {
    const A_RECEBER_STATUSES = ['aguardando_pagamento', 'a_receber', 'parcialmente_pago', 'aguardando pagamento'];

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, status, numero_parcelas, condicoes_pagamento, valor_total, data_pedido, clientes(nome)')
        .in('status', A_RECEBER_STATUSES);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${pedidos.length} orders with 'a receber' statuses.`);

    pedidos.forEach(p => {
        const hasNumParc = (Number(p.numero_parcelas) || Number(p.condicoes_pagamento?.numeroParcelas)) > 0;
        console.log(`[${hasNumParc ? 'VISIBLE' : 'HIDDEN '}] ID: ${p.id}, Status: ${p.status}, Date: ${p.data_pedido}, Client: ${p.clientes?.nome}, Total: ${p.valor_total}`);
    });

    process.exit(0);
}

checkHiddenOrders();
