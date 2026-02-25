import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_UUID = '027e57cb-3f96-43b3-9eee-954988f784e5';

async function discover() {
    console.log('--- Tentativa de descoberta de colunas ---');

    // Tentar inserir apenas o essencial
    const { data, error } = await supabase
        .from('dividas_fixas_wsa')
        .insert([
            {
                descricao: 'TESTE SCHEMA',
                valor: 0,
                vencimento: 1,
                user_id: USER_UUID,
                categoria: 'Fixa'
            }
        ])
        .select();

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('SUCESSO! Colunas do registro inserido:', Object.keys(data[0]));
        // Limpar
        await supabase.from('dividas_fixas_wsa').delete().eq('descricao', 'TESTE SCHEMA');
    }

    process.exit(0);
}

discover();
