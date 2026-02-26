import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectNames() {
    const { data } = await supabase.from('pedidos').select('id, valor_total, clientes(nome)');
    data.forEach(p => {
        if (p.valor_total === 460) {
            console.log(`ID: ${p.id} | Cliente: ${p.clientes?.nome} | Valor: ${p.valor_total}`);
        }
    });
    process.exit(0);
}

inspectNames();
