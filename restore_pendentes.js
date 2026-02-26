import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restorePendentes() {
    console.log('--- Verificando Pedidos Pendentes ---');

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, status, numero_parcelas, clientes(nome)')
        .eq('status', 'pendente');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const toRestore = pedidos.filter(p => !p.numero_parcelas || p.numero_parcelas === 0);
    console.log(`Found ${toRestore.length} pending orders to restore.`);

    for (const p of toRestore) {
        console.log(`Restoring ID: ${p.id}, Client: ${p.clientes?.nome}`);
        await supabase.from('pedidos').update({ numero_parcelas: 1, parcelas_pagas: 0 }).eq('id', p.id);
    }

    console.log('--- Concluído ---');
    process.exit(0);
}

restorePendentes();
