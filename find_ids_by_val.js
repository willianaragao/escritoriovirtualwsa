import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findIds() {
    const targets = [
        { name: 'tiago curicica', val: 6075 },
        { name: 'Ninil Bonsucesso', val: 2313 },
        { name: 'Fabio Atacadao marechal', val: 440 },
        { name: 'Sorritz', val: 6749 }
    ];

    for (const t of targets) {
        const { data: client } = await supabase.from('clientes').select('id').ilike('nome', `%${t.name}%`);
        if (client && client.length > 0) {
            const { data: orders } = await supabase.from('pedidos')
                .select('id, data_pedido, valor_total, numero_parcelas, parcelas_pagas')
                .eq('cliente_id', client[0].id)
                .order('data_pedido', { ascending: false });

            const match = orders?.find(o => Math.abs(o.valor_total - t.val) < 2);
            if (match) {
                console.log(`MATCH FOUND for ${t.name}: ID ${match.id} | Total ${match.valor_total} | Data ${match.data_pedido}`);
            } else {
                console.log(`NO EXACT MATCH for ${t.name}. Orders:`, orders);
            }
        }
    }
    process.exit(0);
}

findIds();
