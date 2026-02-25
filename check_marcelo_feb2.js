import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    // Buscar todos os pedidos do Marcelo Cadeg em fevereiro 2026
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .gte('data_pedido', '2026-02-01')
        .lte('data_pedido', '2026-02-28');

    if (error) { console.error(error); return; }

    const marcelo = data.filter(p => p.clientes?.nome?.toLowerCase().includes('marcelo'));

    console.log('--- Pedidos de "Marcelo" em Fevereiro 2026 ---');
    if (marcelo.length === 0) {
        console.log('NENHUM pedido de Marcelo encontrado em Fevereiro 2026!');
    } else {
        marcelo.forEach(p => {
            console.log(`Data: ${p.data_pedido} | R$${p.valor_total} | Status: ${p.status} | Cliente: ${p.clientes?.nome}`);
        });
    }

    // Buscar especificamente o pedido de 02/02/2026
    const { data: data2, error: e2 } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .eq('data_pedido', '2026-02-02');

    console.log('\n--- Todos os pedidos de 02/02/2026 ---');
    if (e2) console.error(e2);
    else if (!data2 || data2.length === 0) {
        console.log('Nenhum pedido encontrado na data 2026-02-02!');
    } else {
        data2.forEach(p => {
            console.log(`ID: ${p.id} | R$${p.valor_total} | Status: ${p.status} | Cliente: ${p.clientes?.nome}`);
        });
    }
}

check();
