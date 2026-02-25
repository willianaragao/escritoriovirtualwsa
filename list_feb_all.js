import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAll() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .gte('data_pedido', '2026-02-01')
        .lte('data_pedido', '2026-02-28');

    if (error) { console.error(error); return; }

    console.log(`Total orders in Feb: ${data.length}`);
    data.forEach(p => {
        console.log(`${p.data_pedido} | R$ ${p.valor_total} | Status: ${p.status} | Cliente: ${p.clientes?.nome}`);
    });
}

listAll();
