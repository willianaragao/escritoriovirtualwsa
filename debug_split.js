import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugSplit() {
    console.log('--- Debugging Bank/Cash Split for Feb 2026 ---');

    // Entradas
    const { data: pedidos } = await supabase.from('pedidos').select('*');
    let entBanco = 0, entCaixa = 0;

    pedidos.forEach(p => {
        const parts = p.data_pedido?.split('T')[0].split('-');
        if (parts && parts[0] === '2026' && parts[1] === '02') {
            const val = Number(p.valor_total) || 0;
            const forma = (p.condicoes_pagamento?.formaPagamento || '').toLowerCase();
            const isBank = ['pix', 'boleto', 'cartao'].some(m => forma.includes(m));
            if (isBank) entBanco += val; else entCaixa += val;
        }
    });

    // Saídas
    const { data: despesas } = await supabase.from('despesas').select('*');
    let despBanco = 0, despCaixa = 0;
    despesas.forEach(d => {
        const parts = d.data?.split('T')[0].split('-');
        if (parts && parts[0] === '2026' && parts[1] === '02') {
            const val = Number(d.valor) || 0;
            const meio = (d.meio_pagamento || '').toLowerCase();
            if (meio === 'dinheiro') despCaixa += val; else despBanco += val;
        }
    });

    const calcBanco = entBanco - despBanco;
    const calcCaixa = entCaixa - despCaixa;
    const total = calcBanco + calcCaixa;

    console.log(`Calculado Banco: ${calcBanco}`);
    console.log(`Calculado Caixa: ${calcCaixa}`);
    console.log(`Total: ${total}`);

    // Alvo do usuário (antes dos 50 reais extras): Total 7079.94, Banco 6832.46, Caixa 247.48
    // Se o total atual for ~7029.94, o banco deveria ser ~6782.46

    process.exit(0);
}

debugSplit();
