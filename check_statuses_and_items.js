import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('--- Status únicos em pedidos ---');
    const { data: statuses } = await supabase.from('pedidos').select('status');
    const unique = [...new Set(statuses?.map(s => s.status))];
    console.log('Statuses:', unique);

    console.log('--- Tentando item_pedido e items_pedido ---');
    const { data: d1, error: e1 } = await supabase.from('item_pedido').select('*').limit(1);
    if (!e1) console.log('Tabela item_pedido encontrada. Colunas:', Object.keys(d1[0]));

    const { data: d2, error: e2 } = await supabase.from('items_pedido').select('*').limit(1);
    if (!e2) console.log('Tabela items_pedido encontrada. Colunas:', Object.keys(d2[0]));

    const { data: d3, error: e3 } = await supabase.from('produtos_venda').select('*').limit(1);
    if (!e3) console.log('Tabela produtos_venda encontrada. Colunas:', Object.keys(d3[0]));

    process.exit(0);
}

check();
