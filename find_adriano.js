import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAdriano() {
    console.log('Searching for Adriano Mercadao...');
    const { data: clientData } = await supabase.from('clientes').select('id, nome').ilike('nome', '%Adriano%');
    console.log('Clients found:', clientData);

    if (clientData && clientData.length > 0) {
        const client = clientData.find(c => c.nome.includes('Mercadao'));
        if (client) {
            const { data: pedidos } = await supabase.from('pedidos').select('*, clientes(nome)').eq('cliente_id', client.id);
            console.log('Orders found:', JSON.stringify(pedidos, null, 2));
        } else {
            console.log('Adriano Mercadao not in list');
        }
    }
    process.exit(0);
}

findAdriano();
