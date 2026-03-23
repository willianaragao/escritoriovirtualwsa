import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigate() {
    console.log('Searching for Adriano Mercadao...');
    const { data: clientData } = await supabase.from('clientes').select('*').ilike('nome', '%Adriano%');
    console.log('Clients found:', clientData);

    if (clientData && clientData.length > 0) {
        const adriano = clientData.find(c => c.nome.includes('Mercadao'));
        if (adriano) {
            console.log('--- Adriano Client Data ---');
            console.log(adriano);

            const { data: pedidos } = await supabase.from('pedidos').select('*').eq('cliente_id', adriano.id);
            console.log('--- Adriano Orders ---');
            console.log(JSON.stringify(pedidos, null, 2));

            // Look for the specific 3770 order
            const targetOrder = pedidos.find(p => p.valor_total === 3770 || p.valor_total === 3770.00);
            if (targetOrder) {
                console.log('--- Target Order 3770 ---');
                console.log(targetOrder);
            }

            // Check if there are any other related tables like 'dividas' or 'pagamentos'
            // Based on the user mention of 'valor a receber foi pra 2520,00'
            const { data: tables } = await supabase.rpc('get_tables'); // This might not work if RPC doesn't exist
            // I'll try to check 'dividas' table if it exists as seen in file list 'check_dividas_schema.js'
            const { data: dividas } = await supabase.from('dividas').select('*').eq('cliente_id', adriano.id);
            if (dividas) {
                console.log('--- Adriano Dividas ---');
                console.log(dividas);
            }
        }
    }
    process.exit(0);
}

investigate();
