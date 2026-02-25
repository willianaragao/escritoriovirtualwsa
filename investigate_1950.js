import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigate() {
    // 1. Find the R$1950 order 
    const { data: orders1950, error: e1 } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .eq('valor_total', 1950);

    console.log('--- Pedidos com valor R$1950.00 ---');
    if (e1) console.error(e1);
    else orders1950?.forEach(p => console.log(`ID: ${p.id} | Data: ${p.data_pedido} | Status: ${p.status} | Cliente: ${p.clientes?.nome}`));

    // 2. Count by status for February 2026
    const { data: allFeb } = await supabase
        .from('pedidos')
        .select('valor_total, status')
        .gte('data_pedido', '2026-02-01')
        .lte('data_pedido', '2026-02-28');

    const totals = { pago: 0, pendente: 0, a_receber: 0 };
    allFeb?.forEach(p => { totals[p.status] = (totals[p.status] || 0) + (p.valor_total || 0); });

    console.log('\n--- Totais por status em Fevereiro 2026 ---');
    console.log(`Pagos:      R$ ${totals.pago.toFixed(2)}`);
    console.log(`Pendentes:  R$ ${totals.pendente.toFixed(2)}`);
    console.log(`A Receber:  R$ ${totals.a_receber.toFixed(2)}`);
    console.log(`TOTAL GERAL: R$ ${(totals.pago + totals.pendente + totals.a_receber).toFixed(2)}`);
}

investigate();
