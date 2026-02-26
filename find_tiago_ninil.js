import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findSpecifics() {
    console.log('--- Searching Tiago ---');
    const { data: tiago } = await supabase.from('pedidos').select('id, data_pedido, valor_total, numero_parcelas, parcelas_pagas, condicoes_pagamento').ilike('clientes(nome)', '%tiago%').order('data_pedido', { ascending: false });
    console.log(JSON.stringify(tiago, null, 2));

    console.log('--- Searching Ninil ---');
    const { data: ninil } = await supabase.from('pedidos').select('id, data_pedido, valor_total, numero_parcelas, parcelas_pagas, condicoes_pagamento').ilike('clientes(nome)', '%Ninil%').order('data_pedido', { ascending: false });
    console.log(JSON.stringify(ninil, null, 2));

    process.exit(0);
}

findSpecifics();
