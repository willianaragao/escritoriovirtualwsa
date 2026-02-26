import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listInstallmentOrders() {
    console.log('--- Buscando pedidos com parcelas cadastradas ---');

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, numero_parcelas, parcelas_pagas, condicoes_pagamento, clientes(nome)')
        .gt('numero_parcelas', 0)
        .order('data_pedido', { ascending: false });

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log(`Total encontrado: ${pedidos.length} pedidos.`);
        console.table(pedidos.map(p => ({
            Cliente: p.clientes?.nome || 'N/A',
            Data: p.data_pedido,
            Total: p.valor_total,
            Parcelas: p.numero_parcelas,
            Pagas: p.parcelas_pagas,
            Inicio: p.condicoes_pagamento?.dataPrimeiraParcela || 'S/Data'
        })));
    }
    process.exit(0);
}

listInstallmentOrders();
