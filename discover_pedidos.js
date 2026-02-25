import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function discoverPedidos() {
    console.log('--- Descobrindo Schema da tabela pedidos ---');

    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Erro:', error);
    } else if (data && data.length > 0) {
        console.log('Colunas de pedidos:', Object.keys(data[0]));
        console.log('Amostra de dados:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('Tabela pedidos está vazia.');
        // Try to infer columns
        const { error: testError } = await supabase.from('pedidos').select('id, cliente, data, status, valor_total').limit(0);
        if (!testError) console.log('Colunas inferidas: id, cliente, data, status, valor_total');
    }
    process.exit(0);
}

discoverPedidos();
