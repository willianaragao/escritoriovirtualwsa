import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateDate() {
    // Encontrar o pedido específico: Marcelo Cadeg, 31/01/2026, R$1950, pago
    const { data: found, error: e1 } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status, clientes(nome)')
        .eq('data_pedido', '2026-01-31')
        .eq('valor_total', 1950)
        .eq('status', 'pago');

    if (e1) { console.error('Erro ao buscar:', e1); return; }
    if (!found || found.length === 0) { console.log('Pedido não encontrado!'); return; }

    // Filtrar apenas o do Marcelo
    const marceloPedido = found.find(p => p.clientes?.nome?.toLowerCase().includes('marcelo'));
    if (!marceloPedido) { console.log('Pedido do Marcelo não encontrado entre os resultados:', found); return; }

    console.log(`Encontrado: ID ${marceloPedido.id} | ${marceloPedido.data_pedido} | R$${marceloPedido.valor_total} | ${marceloPedido.clientes?.nome}`);
    console.log('Atualizando data de 2026-01-31 para 2026-02-02...');

    const { error: e2 } = await supabase
        .from('pedidos')
        .update({ data_pedido: '2026-02-02' })
        .eq('id', marceloPedido.id);

    if (e2) {
        console.error('Erro ao atualizar:', e2);
    } else {
        console.log('✅ Data atualizada com sucesso! Pedido agora em 02/02/2026.');
    }
}

updateDate();
