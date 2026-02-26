import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function countStatuses() {
    const { data, error } = await supabase.from('pedidos').select('status');
    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    data.forEach(p => {
        counts[p.status] = (counts[p.status] || 0) + 1;
    });

    console.log('--- Status Counts in DB ---');
    console.log(counts);

    // Also get totals for the current month vs all months
    const { data: all } = await supabase.from('pedidos').select('status, data_pedido');
    const feb2026 = all.filter(p => p.data_pedido?.startsWith('2026-02'));

    const febCounts = {};
    feb2026.forEach(p => {
        febCounts[p.status] = (febCounts[p.status] || 0) + 1;
    });

    console.log('--- Status Counts in Feb 2026 ---');
    console.log(febCounts);

    process.exit(0);
}

countStatuses();
