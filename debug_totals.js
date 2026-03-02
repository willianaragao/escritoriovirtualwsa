
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyze() {
    console.log('Fetching records from gastos_materia_prima...');
    const { data, error } = await supabase.from('gastos_materia_prima').select('*');
    if (error) {
        console.error(error);
        return;
    }

    // Group by month/year to find the 19620 total
    const groups = {};
    data.forEach(p => {
        const d = new Date(p.data + 'T12:00:00');
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (!groups[key]) groups[key] = { total: 0, items: [] };
        groups[key].total += (p.valor || 0);
        groups[key].items.push(p);
    });

    Object.keys(groups).forEach(key => {
        if (Math.abs(groups[key].total - 19620) < 100 || key === '3/2026' || key === '2/2026') {
            console.log(`\n--- Month: ${key} (Total: ${groups[key].total}) ---`);
            groups[key].items.forEach(item => {
                console.log(`ID: ${item.id} | Data: ${item.data} | Valor: ${item.valor} | Qtd: ${item.quantidade} | Desc: ${item.descricao} | Forn: ${item.fornecedor}`);
            });
        }
    });
}
analyze();
