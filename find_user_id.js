import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUserId() {
    console.log('--- Buscando Registros para descobrir user_id (UUID) ---');

    // Tentar buscar de qualquer tabela que possa ter registros
    const tables = ['dividas_fixas_wsa', 'transacoes'];

    for (const table of tables) {
        console.log(`Verificando tabela: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) {
            console.error(`Erro na tabela ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`Amostra de dados em ${table}:`, JSON.stringify(data[0], null, 2));
            if (data[0].user_id) {
                console.log(`SUCESSO! user_id encontrado: ${data[0].user_id}`);
                // process.exit(0); // Continue to check other tables out of curiosity
            }
        } else {
            console.log(`Tabela ${table} vazia.`);
        }
    }
    process.exit(0);
}

findUserId();
