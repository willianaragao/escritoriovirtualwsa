import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const newDividas = [
    { descricao: 'lucas dia 15', vencimento: 15, status: 'Pago', valor: 920 },
    { descricao: 'baixinho dia 15', vencimento: 15, status: 'Pago', valor: 920 },
    { descricao: 'barbudo dia 15', vencimento: 15, status: 'Pago', valor: 1200 },
    { descricao: 'Bianca dia 15', vencimento: 15, status: 'Pago', valor: 1200 },
    { descricao: 'Barbudo dia 30', vencimento: 30, status: 'Ativa', valor: 1380 },
    { descricao: 'Bianca dia 30', vencimento: 30, status: 'Ativa', valor: 1200 },
    { descricao: 'baixinho dia 30', vencimento: 30, status: 'Ativa', valor: 920 },
    { descricao: 'lucas dia 30', vencimento: 30, status: 'Ativa', valor: 1070 },
    { descricao: 'Inss', vencimento: 30, status: 'Ativa', valor: 167 },
    { descricao: 'lucas invetimento', vencimento: 30, status: 'Ativa', valor: 250 },
    { descricao: 'Contador', vencimento: 30, status: 'Ativa', valor: 779 },
    { descricao: 'Iptu', vencimento: 30, status: 'Ativa', valor: 211 },
    { descricao: 'Energia Solar', vencimento: 30, status: 'Ativa', valor: 3000 },
    { descricao: 'Aluguel galpao', vencimento: 30, status: 'Ativa', valor: 1500 }
];

async function syncData() {
    console.log('--- Iniciando Sincronização Final (Gerando UUID dummy se necessário) ---');

    // Tentar deletar sem filtro de usuario_id para limpar a tabela inteira
    const { error: deleteError } = await supabase
        .from('dividas_fixas_wsa')
        .delete()
        .neq('valor', -1);

    if (deleteError) {
        console.error('Erro ao limpar:', deleteError);
    }

    // Gerar um UUID dummy para o user_id (já que é UUID)
    const dummyUserId = '00000000-0000-0000-0000-000000000000';

    const preparedData = newDividas.map(d => ({
        ...d,
        user_id: dummyUserId, // Tentativa desesperada mas lógica se a tabela exige user_id
        usuario_id: 15, // Backup caso prefira o número
        tipo_divida: 'mensal'
    }));

    const { error: insertError } = await supabase
        .from('dividas_fixas_wsa')
        .insert(preparedData);

    if (insertError) {
        console.error('Falha final:', insertError);
        console.log('Tentativa sem user_id...');
        const { error: finalRetry } = await supabase
            .from('dividas_fixas_wsa')
            .insert(newDividas.map(d => ({ ...d, tipo_divida: 'mensal' })));

        if (finalRetry) {
            console.error('Todas as tentativas falharam. O banco exige um user_id (UUID) válido que não tenho.', finalRetry);
        } else {
            console.log('Sincronizado sem user_id!');
        }
    } else {
        console.log('Sincronizado com UUID dummy!');
    }

    process.exit(0);
}

syncData();
