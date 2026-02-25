import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const commonTableNames = [
    'pedido_itens', 'itens_pedidos', 'itens_venda', 'venda_itens',
    'produtos_pedido', 'pedido_produtos', 'itens', 'produtos',
    'vendas', 'movimentacoes_estoque', 'contas_receber', 'contas_pagar'
];

async function bruteForceTables() {
    console.log('--- Brute forcing table names ---');
    for (const name of commonTableNames) {
        const { error } = await supabase.from(name).select('*').limit(0);
        if (!error) {
            console.log(`Table found: ${name}`);
            const { data } = await supabase.from(name).select('*').limit(1);
            if (data && data.length > 0) {
                console.log(`Columns for ${name}:`, Object.keys(data[0]));
            }
        }
    }
    process.exit(0);
}

bruteForceTables();
