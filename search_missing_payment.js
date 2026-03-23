import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function search1270() {
    console.log('Searching for 1270 in pedidos...');
    const { data: pedidos } = await supabase.from('pedidos').select('*').or('valor_total.eq.1270,condicoes_pagamento->>valor_recebido.eq.1270');
    console.log('Pedidos with 1270:', pedidos);

    console.log('Checking dividas table...');
    const { data: dividas } = await supabase.from('dividas').select('*');
    const adrianoDividas = dividas?.filter(d => d.cliente_id === '4ed5a9d3-42ab-425f-9c3b-71a7e4f53d09');
    console.log('Adriano Dividas:', adrianoDividas);

    // Check for a table called 'pagamentos' or similar if possible
    // Since I don't know all tables, let's try some common names
    const commonTables = ['pagamentos', 'parcelas', 'movimentacoes_caixa'];
    for (const table of commonTables) {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (!error) {
            console.log(`Table ${table} exists!`);
            const filtered = data?.filter(d => d.valor === 1270 || d.valor_pago === 1270 || JSON.stringify(d).includes('1270'));
            if (filtered && filtered.length > 0) {
                console.log(`Found 1270 in ${table}:`, filtered);
            }
        }
    }

    process.exit(0);
}

search1270();
