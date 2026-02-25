import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log('--- Verificando Pedidos e Relacionamento com Clientes ---');

    // Pegar os últimos 5 pedidos para ver a estrutura e se o join funciona
    const { data: pedidos, error: pedErr } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .limit(5);

    if (pedErr) {
        console.error('Erro ao buscar pedidos:', pedErr);
    } else {
        console.log('Amostra de pedidos:', JSON.stringify(pedidos, null, 2));
    }

    // Verificar se a tabela clientes tem dados
    const { data: clientes, error: cliErr } = await supabase
        .from('clientes')
        .select('*')
        .limit(5);

    if (cliErr) {
        console.error('Erro ao buscar clientes:', cliErr);
    } else {
        console.log('Amostra de clientes:', JSON.stringify(clientes, null, 2));
    }
}

checkData();
