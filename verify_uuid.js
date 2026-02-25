import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const testUUID = '49367b35-6327-43b1-9a64-294a8f645ce5';

async function verifyUUID() {
    console.log(`--- Verificando UUID: ${testUUID} ---`);

    // Tentar inserir um registro de teste
    const { data, error } = await supabase
        .from('dividas_fixas_wsa')
        .insert([
            {
                descricao: 'TESTE RESTAURAÇÃO',
                valor: 0,
                vencimento: 1,
                user_id: testUUID,
                categoria: 'Fixa'
            }
        ])
        .select();

    if (error) {
        console.error('Erro na inserção de teste:', error);
        if (error.code === '23503') {
            console.log('O UUID é válido sintaticamente, mas não existe na tabela de referência (Foreign Key Violation).');
        }
    } else {
        console.log('SUCESSO! O UUID foi aceito e o registro inserido:', data);
        // Limpar o teste
        await supabase.from('dividas_fixas_wsa').delete().eq('descricao', 'TESTE RESTAURAÇÃO');
    }

    process.exit(0);
}

verifyUUID();
