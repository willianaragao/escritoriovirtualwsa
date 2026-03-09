import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function analyzeBalances() {
    const { data: pedidos } = await supabase.from('pedidos').select('valor_total, status, condicoes_pagamento, data_pedido, mes_referencia');
    const { data: despesas } = await supabase.from('despesas').select('valor, meio_pagamento, data');

    const periods = [
        { year: 2026, month: 0, label: 'Jan/2026' },
        { year: 2026, month: 1, label: 'Feb/2026' },
        { year: 2026, month: 2, label: 'Mar/2026' }
    ];

    console.log('--- CUMULATIVE TOTALS (NO OFFSETS) ---');

    periods.forEach(period => {
        let globalBanco = 0;
        let globalCaixa = 0;

        pedidos.forEach(p => {
            if (!p.data_pedido) return;
            const dateStr = p.data_pedido.split('T')[0];
            const parts = dateStr.split('-');
            const pYear = parseInt(parts[0]);
            let pMonth = parseInt(parts[1]) - 1;

            if (p.mes_referencia) {
                const monthsNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                const refIdx = monthsNames.indexOf(p.mes_referencia.toLowerCase());
                if (refIdx !== -1) pMonth = refIdx;
            }

            const val = Number(p.valor_total) || 0;
            let valorPago = 0;
            if (p.status === 'pago') valorPago = val;
            else if (p.status !== 'pendente') valorPago = Number(p.condicoes_pagamento?.valor_recebido || 0);

            if (valorPago > 0) {
                const forma = (p.condicoes_pagamento?.formaPagamento || '').toLowerCase();
                const isCash = ['dinheiro', 'cheque'].some(m => forma === m || forma.includes(m));

                if (pYear < period.year || (pYear === period.year && pMonth <= period.month)) {
                    if (isCash) globalCaixa += valorPago;
                    else globalBanco += valorPago;
                }
            }
        });

        despesas.forEach(d => {
            if (!d.data) return;
            const parts = d.data.split('T')[0].split('-');
            const dYear = parseInt(parts[0]);
            const dMonth = parseInt(parts[1]) - 1;
            const val = Number(d.valor) || 0;
            const meio = (d.meio_pagamento || '').toLowerCase();
            const isExpCash = ['dinheiro', 'cheque'].some(m => meio === m || meio.includes(m));

            if (dYear < period.year || (dYear === period.year && dMonth <= period.month)) {
                if (isExpCash) globalCaixa -= val;
                else globalBanco -= val;
            }
        });

        console.log(`${period.label} (${period.year}-${period.month}): Banco: ${globalBanco.toFixed(2)}, Caixa: ${globalCaixa.toFixed(2)}`);
    });
}

analyzeBalances();
