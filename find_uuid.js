import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUUID() {
    console.log('--- Buscando Registros em qualquer tabela que possa ter UUIDs ---');
    const tables = ['dividas_fixas_wsa', 'transacoes', 'categoria_trasacoes', 'logs_acesso'];

    for (const table of tables) {
        console.log(`Verificando colunas de user/usuario em: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(2);
        if (error) {
            console.error(`Erro na tabela ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Exemplo de ${table}:`, JSON.stringify(data[0], null, 2));
        }
    }
    process.exit(0);
}

findUUID();
