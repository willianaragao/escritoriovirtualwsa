import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log('--- Verificação Final via Terminal ---');
    const { data, error } = await supabase
        .from('dividas_fixas_wsa')
        .select('*')
        .order('vencimento', { ascending: true });

    if (error) {
        console.error('Erro ao buscar dados:', error);
    } else {
        console.log(`Sucesso! Encontradas ${data.length} dívidas.`);
        data.forEach(d => {
            const status = d.paga ? 'Pago' : (d.ativa ? 'Ativa' : 'Inativa');
            console.log(`- ${d.descricao.padEnd(20)} | Venc: ${d.vencimento.toString().padStart(2)} | Status: ${status.padEnd(6)} | Valor: R$ ${d.valor.toFixed(2).padStart(8)}`);
        });

        const total = data.reduce((acc, curr) => acc + (curr.valor || 0), 0);
        console.log(`\nTOTAL MENSAL: R$ ${total.toFixed(2)}`);
    }
    process.exit(0);
}

verify();
