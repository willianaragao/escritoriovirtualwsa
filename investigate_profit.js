import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigate() {
    console.log('--- Investigando Tabelas para Lucro ---');

    // Pedidos
    const { data: pedidos } = await supabase.from('pedidos').select('*').limit(1);
    if (pedidos && pedidos.length > 0) {
        console.log('Colunas de PEDIDOS:', Object.keys(pedidos[0]));
    }

    // Produtos
    const { data: produtos } = await supabase.from('produtos').select('*').limit(1);
    if (produtos && produtos.length > 0) {
        console.log('Colunas de PRODUTOS:', Object.keys(produtos[0]));
    }

    // Pedidos_Produtos (itens do pedido)
    const { data: pedidosProdutos } = await supabase.from('pedidos_produtos').select('*').limit(1);
    if (pedidosProdutos && pedidosProdutos.length > 0) {
        console.log('Colunas de PEDIDOS_PRODUTOS:', Object.keys(pedidosProdutos[0]));
    }

    process.exit(0);
}

investigate();
