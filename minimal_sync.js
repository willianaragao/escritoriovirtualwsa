import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchemaAndSync() {
    console.log('--- Tentativa de Sincronização Minimalista e Segura ---');

    // 1. Tentar selecionar apenas um registro de qualquer tabela para ver o formato do ID
    const { data: userData } = await supabase.from('usuarios').select('id').limit(1);
    console.log('Exemplo de ID em usuarios:', userData?.[0]?.id);

    // 2. Tentar inserir na dividas_fixas_wsa SEM a coluna status e SEM user_id (para ver se são opcionais)
    const testDivida = {
        descricao: 'Teste Schema',
        vencimento: 1,
        valor: 100 // 'valor' parece ser a coluna correta baseada no legacy/script.js e erros anteriores
    };

    console.log('Tentando inserção minimalista...');
    const { error: testError } = await supabase.from('dividas_fixas_wsa').insert([testDivida]);

    if (testError) {
        console.log('Erro na minimalista:', testError.message);
        console.log('Código do erro:', testError.code);

        if (testError.message.includes('user_id')) {
            console.log('CONFIRMADO: user_id é obrigatório e precisa de um UUID válido.');
        }
        if (testError.message.includes('status')) {
            console.log('CONFIRMADO: status é esperado mas não está no cache (problema de RLS ou Schema).');
        }
    } else {
        console.log('Sucesso na inserção minimalista! user_id e status são opcionais.');
    }

    process.exit(0);
}

checkSchemaAndSync();
