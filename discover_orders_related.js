import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function discoverSchemas() {
    console.log('--- Descobrindo Schema da tabela clientes ---');
    const { data: clientes, error: errC } = await supabase.from('clientes').select('*').limit(1);
    if (errC) console.error('Erro clientes:', errC);
    else console.log('Colunas clientes:', Object.keys(clientes[0]));

    console.log('--- Descobrindo Schema da tabela itens_pedido ---');
    const { data: itens, error: errI } = await supabase.from('itens_pedido').select('*').limit(1);
    if (errI) {
        console.error('Erro itens_pedido:', errI);
        console.log('Tentando pedido_produtos...');
        const { data: pp, error: errPP } = await supabase.from('pedido_produtos').select('*').limit(1);
        if (errPP) console.error('Erro pedido_produtos:', errPP);
        else console.log('Colunas pedido_produtos:', Object.keys(pp[0]));
    } else {
        console.log('Colunas itens_pedido:', Object.keys(itens[0]));
    }
    process.exit(0);
}

discoverSchemas();
