import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    console.log('--- Listando Tabelas Supabase ---');
    // Querying information_schema is restricted for anon key,
    // so we'll try to select from common tables to see if they exist.
    const tables = ['dividas_fixas_wsa', 'stats', 'transactions', 'clients', 'users', 'dividas'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
            console.log(`- Tabela [${table}] existe.`);
        } else {
            // If code is not 404, it exists but we have some other issue (RLS, schema error)
            if (error.code !== 'PGRST116' && error.code !== '42P01') {
                console.log(`- Tabela [${table}] provavelmente existe (Erro: ${error.code} - ${error.message})`);
            } else {
                console.log(`- Tabela [${table}] NÃO encontrada.`);
            }
        }
    }
    process.exit(0);
}

listTables();
