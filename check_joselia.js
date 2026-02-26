import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkJoselia() {
    console.log('--- Verificando Pedido da Joselia Jh niteroi ---');

    // Search by client name and total value
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .eq('valor_total', 460)
        .ilike('clientes.nome', '%Joselia%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (pedidos && pedidos.length > 0) {
        console.log('Pedido encontrado:', JSON.stringify(pedidos[0], null, 2));
    } else {
        console.log('Nenhum pedido de 460 encontrado para Joselia.');
    }

    process.exit(0);
}

checkJoselia();
