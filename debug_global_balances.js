import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function calculateGlobalBalances() {
    // Pedidos (Entradas)
    const { data: pedidos, error: pedErr } = await supabase
        .from('pedidos')
        .select('valor_total, status, condicoes_pagamento, parcelas_pagas, numero_parcelas')

    if (pedErr) {
        console.error('Error fetching pedidos:', pedErr)
        return
    }

    let dbBanco = 0
    let dbCaixa = 0

    pedidos.forEach(p => {
        const val = Number(p.valor_total) || 0
        const numParcelas = Number(p.numero_parcelas) || Number(p.condicoes_pagamento?.numeroParcelas) || 1
        const parcelasPagas = Number(p.parcelas_pagas) || 0

        let valorPago = 0
        if (p.status === 'pago') {
            valorPago = val
        } else if (p.status === 'pendente') {
            valorPago = 0
        } else {
            const valorPorParcela = val / (numParcelas || 1)
            const calcParcelas = valorPorParcela * parcelasPagas
            const jsonRecebido = Number(p.condicoes_pagamento?.valor_recebido || 0)
            valorPago = Math.max(calcParcelas, jsonRecebido)
        }

        if (valorPago > 0) {
            const forma = (p.condicoes_pagamento?.formaPagamento || '').toLowerCase()
            const isBank = ['pix', 'boleto', 'cartao_credito', 'cartao_debito', 'cartao'].some(m => forma === m || forma.includes(m))
            const isCash = ['dinheiro', 'cheque'].some(m => forma === m || forma.includes(m))

            if (isCash) dbCaixa += valorPago
            else dbBanco += valorPago
        }
    })

    // Despesas (Saídas)
    const { data: despesas, error: despErr } = await supabase
        .from('despesas')
        .select('valor, meio_pagamento')

    if (despErr) {
        console.error('Error fetching despesas:', despErr)
        return
    }

    despesas.forEach(d => {
        const val = Number(d.valor) || 0
        const meio = (d.meio_pagamento || '').toLowerCase()
        const isExpBank = ['pix', 'boleto', 'cartao', 'cartao_credito', 'cartao_debito'].some(m => meio === m || meio.includes(m))
        const isExpCash = ['dinheiro', 'cheque'].some(m => meio === m || meio.includes(m))

        if (isExpCash) dbCaixa -= val
        else dbBanco -= val
    })

    console.log('--- DATABASE TOTALS (NO OFFSETS) ---')
    console.log('DB Banco:', dbBanco.toFixed(2))
    console.log('DB Caixa:', dbCaixa.toFixed(2))
    console.log('Total:', (dbBanco + dbCaixa).toFixed(2))
}

calculateGlobalBalances()
