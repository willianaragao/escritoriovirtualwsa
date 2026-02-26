import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findTargetOrders() {
    const clients = ['tiago curicica', 'Ninil Bonsucesso', 'Fabio Atacadao marechal', 'Sorritz'];

    console.log('Searching for target clients and their orders...');

    for (const name of clients) {
        const { data: client } = await supabase.from('clientes').select('id, nome').ilike('nome', `%${name}%`);
        if (client && client.length > 0) {
            const { data: pedidos } = await supabase.from('pedidos')
                .select('*')
                .eq('cliente_id', client[0].id)
                .order('data_pedido', { ascending: false })
                .limit(5);

            console.log(`\n--- ${client[0].nome} ---`);
            pedidos?.forEach(p => {
                console.log(`ID: ${p.id} | Data: ${p.data_pedido} | Total: ${p.valor_total} | Status: ${p.status}`);
                console.log(`Current Installments: ${p.numero_parcelas} | Paid: ${p.parcelas_pagas}`);
            });
        } else {
            console.log(`\nClient not found: ${name}`);
        }
    }
    process.exit(0);
}

findTargetOrders();
