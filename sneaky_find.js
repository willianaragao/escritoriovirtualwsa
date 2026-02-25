import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findUUIDAnywhere() {
    console.log('--- Buscando QUALQUER UUID em QUALQUER tabela ---');

    // Lista estendida de tabelas baseada nos logs de n8n e buscas
    const tables = [
        'dividas_fixas_wsa',
        'transacoes',
        'usuarios',
        'solicitacoes_lgpd',
        'consentimentos_usuarios',
        'lancamentos_futuros',
        'logs_acesso',
        'investimentos',
        'categoria_trasacoes'
    ];

    for (const table of tables) {
        console.log(`Buscando em: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`  Erro na tabela ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            const row = data[0];
            for (const [key, value] of Object.entries(row)) {
                // Verificar se o valor parece um UUID
                if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                    console.log(`  SNEAKY UUID ENCONTRADO! Tabela: ${table}, Coluna: ${key}, Valor: ${value}`);
                }
            }
        } else {
            console.log(`  Tabela ${table} vazia.`);
        }
    }
    process.exit(0);
}

findUUIDAnywhere();
