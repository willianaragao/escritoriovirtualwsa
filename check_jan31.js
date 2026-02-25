import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    // 1. Checar 31/01/2026
    const { data: jan31 } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .eq('data_pedido', '2026-01-31');

    console.log('--- Pedidos em 31/01/2026 ---');
    if (!jan31 || jan31.length === 0) {
        console.log('NENHUM pedido encontrado em 31/01/2026');
    } else {
        jan31.forEach(p => console.log(`R$${p.valor_total} | Status: ${p.status} | Cliente: ${p.clientes?.nome}`));
    }

    // 2. Todos os pedidos do Marcelo Cadeg
    const { data: all } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)');

    const marcelo = (all || []).filter(p => p.clientes?.nome?.toLowerCase().includes('marcelo'));
    console.log('\n--- TODOS os pedidos de Marcelo ordenados ---');
    marcelo
        .sort((a, b) => (a.data_pedido || '').localeCompare(b.data_pedido || ''))
        .forEach(p => console.log(`${p.data_pedido} | R$${p.valor_total} | Status: ${p.status}`));
}

check();
