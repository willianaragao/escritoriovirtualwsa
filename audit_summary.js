import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('valor_total, data_pedido, status')
        .eq('status', 'pago');

    if (error) { console.error(error); return; }

    let totalFeb = 0;
    let count = 0;

    data.forEach(p => {
        if (!p.data_pedido) return;
        const [year, month] = p.data_pedido.split('-');
        if (year === '2026' && month === '02') {
            totalFeb += (p.valor_total || 0);
            count++;
        }
    });

    console.log(`SUMMARY: Total=R$${totalFeb.toFixed(2)}, Count=${count}`);
}

audit();
