import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_UUID = '027e57cb-3f96-43b3-9eee-954988f784e5';

const restoredData = [
    { descricao: 'lucas dia 15', vencimento: 15, paga: true, ativa: true, valor: 920.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'baixinho dia 15', vencimento: 15, paga: true, ativa: true, valor: 920.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'barbudo dia 15', vencimento: 15, paga: true, ativa: true, valor: 1200.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Bianca dia 15', vencimento: 15, paga: true, ativa: true, valor: 1200.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Barbudo dia 30', vencimento: 30, paga: false, ativa: true, valor: 1380.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Bianca dia 30', vencimento: 30, paga: false, ativa: true, valor: 1200.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'baixinho dia 30', vencimento: 30, paga: false, ativa: true, valor: 920.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'lucas dia 30', vencimento: 30, paga: false, ativa: true, valor: 1070.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Inss', vencimento: 30, paga: false, ativa: true, valor: 167.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'lucas invetimento', vencimento: 30, paga: false, ativa: true, valor: 250.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Contador', vencimento: 30, paga: false, ativa: true, valor: 779.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Iptu', vencimento: 30, paga: false, ativa: true, valor: 211.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Energia Solar', vencimento: 30, paga: false, ativa: true, valor: 3000.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID },
    { descricao: 'Aluguel galpao', vencimento: 30, paga: false, ativa: true, valor: 1500.00, categoria: 'Fixa', tipo: 'mensal', user_id: USER_UUID }
];

async function restore() {
    console.log('--- Iniciando Restauração Final ---');

    // 1. Limpar qualquer dado de teste (opcional, mas seguro)
    await supabase.from('dividas_fixas_wsa').delete().neq('vencimento', -1);

    // 2. Inserir dados recuperados
    const { data, error } = await supabase
        .from('dividas_fixas_wsa')
        .insert(restoredData)
        .select();

    if (error) {
        console.error('ERRO CRÍTICO NA RESTAURAÇÃO:', error);
    } else {
        console.log('RESTAURAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log(`${data.length} registros inseridos.`);
    }

    process.exit(0);
}

restore();
