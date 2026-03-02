
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeFeb() {
    console.log('--- Analisando Entradas de Fevereiro/2026 ---');

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('valor_total, status, condicoes_pagamento, data_pedido, mes_referencia, numero_parcelas, parcelas_pagas, clientes(nome)');

    if (error) {
        console.error(error);
        return;
    }

    let entradasBancoTotal = 0;
    const items = [];

    pedidos.forEach(p => {
        // Lógica de mês (Dashboard)
        let pMonth, pYear;
        const dateStr = p.data_pedido?.includes('T') ? p.data_pedido.split('T')[0] : p.data_pedido;
        if (dateStr) {
            const parts = dateStr.split('-');
            pYear = parseInt(parts[0]);
            pMonth = parseInt(parts[1]) - 1;
        }

        if (p.mes_referencia) {
            const monthsNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const refIdx = monthsNames.indexOf(p.mes_referencia.toLowerCase());
            if (refIdx !== -1) pMonth = refIdx;
        }

        if (pMonth === 1 && pYear === 2026) {
            const val = Number(p.valor_total) || 0;
            const numParcelas = Number(p.numero_parcelas) || 1;
            const parcelasPagas = Number(p.parcelas_pagas) || 0;
            const jsonRecebido = Number(p.condicoes_pagamento?.valor_recebido || 0);

            let valorPago = 0;
            if (p.status === 'pago') {
                valorPago = val;
            } else if (p.status === 'pendente') {
                valorPago = 0;
            } else {
                valorPago = Math.max((val / numParcelas) * parcelasPagas, jsonRecebido);
            }

            if (valorPago > 0) {
                const forma = (p.condicoes_pagamento?.formaPagamento || '').toLowerCase();
                const isBank = ['pix', 'boleto', 'cartao_credito', 'cartao_debito', 'cartao'].some(m => forma === m || forma.includes(m)) || (!forma.includes('dinheiro') && !forma.includes('cheque'));

                if (isBank) {
                    entradasBancoTotal += valorPago;
                    items.push({
                        cliente: p.clientes?.nome,
                        valor: valorPago,
                        forma: forma || 'banco (default)',
                        status: p.status,
                        referencia: p.mes_referencia || 'data_pedido'
                    });
                }
            }
        }
    });

    console.log(JSON.stringify(items, null, 2));
    console.log('Total Banco Calculado:', entradasBancoTotal);
}
analyzeFeb();
