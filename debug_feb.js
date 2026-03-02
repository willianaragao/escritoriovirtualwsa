
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    console.log('--- DEBUG FEBRUARY 2026 ---');

    // 1. Dividas Fixas
    const { data: fixed } = await supabase.from('dividas_fixas_wsa').select('*');
    let totalFixed = 0;
    console.log('ACTIVE FIXED DEBTS:');
    fixed.filter(d => d.ativa !== false).forEach(d => {
        const val = Number(d.valor || d.valor_mensal || 0);
        totalFixed += val;
        console.log(`- ${d.nome} (${d.categoria}): ${val}`);
    });
    console.log('TOTAL FIXED:', totalFixed);

    // 2. Despesas
    const { data: despesas } = await supabase.from('despesas').select('*');
    const feb = despesas.filter(d => {
        const date = new Date(d.data + 'T12:00:00');
        return date.getMonth() === 1 && date.getFullYear() === 2026;
    });

    let totalDesp = 0;
    console.log('\nFEBRUARY EXPENSES (DESPESAS TABLE):');
    feb.forEach(d => {
        totalDesp += (d.valor || 0);
        console.log(`- ${d.descricao} [${d.categoria}]: ${d.valor}`);
    });
    console.log('TOTAL FEB DESPESAS:', totalDesp);
}
debug();
