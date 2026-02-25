import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
    console.log('--- Auditing Pedidos Pagos (Fevereiro 2026) ---');
    const { data, error } = await supabase
        .from('pedidos')
        .select('id, data_pedido, valor_total, status')
        .eq('status', 'pago');

    if (error) {
        console.error('Error:', error);
        return;
    }

    let totalFeb = 0;
    const items = [];

    data.forEach(p => {
        if (!p.data_pedido) return;

        // Use local date parsing logic similar to the frontend
        const [year, month, day] = p.data_pedido.split('-');
        const pYear = parseInt(year);
        const pMonth = parseInt(month); // 1-indexed

        if (pYear === 2026 && pMonth === 2) {
            totalFeb += (p.valor_total || 0);
            items.push(p);
        }
    });

    console.log(`Total found for Feb 2026: R$ ${totalFeb.toFixed(2)}`);
    console.log(`Number of orders: ${items.length}`);
    console.log('Order Details:', items);
}

audit();
