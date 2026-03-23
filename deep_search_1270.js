import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deepSearch() {
    console.log('Fetching all orders...');
    const { data: pedidos } = await supabase.from('pedidos').select('*, clientes(nome)');

    console.log('Searching for 1270...');
    const matches = pedidos.filter(p => JSON.stringify(p).includes('1270'));

    if (matches.length > 0) {
        console.log('Found matches in pedidos:');
        console.log(JSON.stringify(matches, null, 2));
    } else {
        console.log('No matches in pedidos.');
    }

    // Check if there are other tables like "logs" or "history"
    // I'll check "pedidos_produtos" too, maybe a subtotal is 1270
    console.log('Checking pedidos_produtos...');
    const { data: items } = await supabase.from('pedidos_produtos').select('*').or('preco_unitario.eq.1270,subtotal.eq.1270');
    if (items && items.length > 0) {
        console.log('Found 1270 in items:', items);
    }

    process.exit(0);
}

deepSearch();
