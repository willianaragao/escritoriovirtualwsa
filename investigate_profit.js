
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditExpenses() {
    const selectedMonth = 3; // April (0-indexed)
    const selectedYear = 2026;

    const { data: catData } = await supabase.from('categorias').select('nome');
    console.log('Available Categories:', catData?.map(c => c.nome).join(', '));

    const { data: despData, error } = await supabase
        .from('despesas')
        .select('valor, data, descricao, categoria');

    if (error) {
        console.error('Error fetching despesas:', error);
        return;
    }

    const currentMonthDespesas = (despData || []).filter(d => {
        const dDate = new Date(d.data + 'T12:00:00');
        return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    console.log(`Auditing expenses for April 2026. Total items found: ${currentMonthDespesas.length}`);

    let totalDespesasGeral = 0;
    let totalFixasPagas = 0;
    let totalMateriaPrimaPagas = 0;
    let totalRetiradaLucro = 0;
    const itemsClassifiedAsMensais = [];

    currentMonthDespesas.forEach(d => {
        const val = Number(d.valor) || 0;
        totalDespesasGeral += val;

        const cat = (d.categoria || '').toLowerCase();
        const desc = (d.descricao || '').toLowerCase();

        let isExcluded = false;

        if (cat.includes('fixa') || desc.includes('dia 15') || desc.includes('dia 30')) {
            totalFixasPagas += val;
            isExcluded = true;
        }

        if (cat.includes('matéria') || cat.includes('materia') || desc.includes('paguei major')) {
            totalMateriaPrimaPagas += val;
            isExcluded = true;
        }

        if (cat.includes('retirada') || desc.includes('retirada')) {
            totalRetiradaLucro += val;
            isExcluded = true;
        }

        if (!isExcluded) {
            itemsClassifiedAsMensais.push(d);
        }
    });

    console.log('--- ITEMS CLASSIFIED AS MENSAIS (VARIABLES) ---');
    itemsClassifiedAsMensais.forEach(item => {
        console.log(`${item.data} | ${item.categoria} | ${item.descricao} | R$ ${item.valor}`);
    });

    const totalCalculatedMensais = totalDespesasGeral - totalFixasPagas - totalMateriaPrimaPagas - totalRetiradaLucro;
    console.log('-----------------------------------------------');
    console.log(`Total Despesas Geral: R$ ${totalDespesasGeral.toFixed(2)}`);
    console.log(`Total Fixas Pagas: R$ ${totalFixasPagas.toFixed(2)}`);
    console.log(`Total MP Pagas: R$ ${totalMateriaPrimaPagas.toFixed(2)}`);
    console.log(`Total Retirada de Lucro: R$ ${totalRetiradaLucro.toFixed(2)}`);
    console.log(`Total Despesas Mensais (Calculated): R$ ${totalCalculatedMensais.toFixed(2)}`);
}

auditExpenses();
