import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findSpecifics() {
    const names = ['tiago curicica', 'Ninil Bonsucesso'];
    for (const name of names) {
        console.log(`--- ${name} ---`);
        const { data: clients } = await supabase.from('clientes').select('id, nome').ilike('nome', `%${name}%`);
        if (clients && clients.length > 0) {
            const { data: pedidos } = await supabase.from('pedidos')
                .select('*')
                .eq('cliente_id', clients[0].id)
                .order('data_pedido', { ascending: false });
            console.log(JSON.stringify(pedidos, null, 2));
        }
    }
    process.exit(0);
}

findSpecifics();
