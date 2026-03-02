
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAllLuiz() {
    const { data: clientes } = await supabase.from('clientes').select('id, nome').ilike('nome', '%luiz%bras%');
    console.log('Clientes found:', clientes);

    if (clientes && clientes.length > 0) {
        const ids = clientes.map(c => c.id);
        const { data: pedidos } = await supabase
            .from('pedidos')
            .select('*')
            .in('cliente_id', ids);
        console.log('Pedidos found:', JSON.stringify(pedidos, null, 2));
    }
}
findAllLuiz();
