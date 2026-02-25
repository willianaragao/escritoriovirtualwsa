import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function discover() {
    const { data: cols, error } = await supabase.rpc('get_table_columns_v2', { t_name: 'clientes_produtos_precos' });
    if (error) {
        console.log('Error discover columns:', error);
        // Fallback: try to select 1 row
        const { data, error: err2 } = await supabase.from('clientes_produtos_precos').select('*').limit(1);
        if (err2) {
            console.log('Error select fallback:', err2);
        } else if (data && data.length > 0) {
            console.log('Columns found via sample:', Object.keys(data[0]));
        } else {
            console.log('Table found but empty.');
        }
    } else {
        console.log('Columns for clientes_produtos_precos:', cols);
    }
}

discover();
