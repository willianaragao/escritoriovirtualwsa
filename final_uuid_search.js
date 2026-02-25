import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function finalSearch() {
    console.log('--- BUSCA FINAL POR UUID ---');

    // Tabela 'lancamentos_futuros' parece promissora baseada nos nomes de colunas do workflow
    const tables = ['lancamentos_futuros', 'transacoes', 'usuarios'];

    for (const table of tables) {
        console.log(`Buscando em: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(20);
        if (error) {
            console.error(`  Erro ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            data.forEach((row, i) => {
                for (const [key, value] of Object.entries(row)) {
                    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                        console.log(`  [${i}] UUID ENCONTRADO! Tabela: ${table}, Coluna: ${key}, Valor: ${value}`);
                    }
                }
            });
        }
    }
    process.exit(0);
}

finalSearch();
