import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compare() {
    const { data, error } = await supabase.from('pedidos').select('valor_total, data_pedido').eq('status', 'pago');
    if (error) return;

    let totalCorrect = 0;
    let totalDateObj = 0;

    data.forEach(p => {
        if (!p.data_pedido) return;

        // Method 1: String split (Correct for YYYY-MM-DD)
        const [year, month] = p.data_pedido.split('-');
        if (year === '2026' && month === '02') {
            totalCorrect += p.valor_total || 0;
        }

        // Method 2: Date object (Buggy in some timezones)
        const d = new Date(p.data_pedido);
        if (d.getFullYear() === 2026 && (d.getMonth() + 1) === 2) {
            totalDateObj += p.valor_total || 0;
        }
    });

    console.log(`String Split Method: R$ ${totalCorrect.toFixed(2)}`);
    console.log(`Date Object Method: R$ ${totalDateObj.toFixed(2)}`);
    console.log(`Difference: R$ ${(totalCorrect - totalDateObj).toFixed(2)}`);
}

compare();
