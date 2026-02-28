import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('--- Checking ALL custom prices ---');
    const { data, error, count } = await supabase
        .from('clientes_produtos_precos')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total custom prices:', count);
        if (data.length > 0) {
            console.log('Sample rows:', data.slice(0, 5));
        }
    }
}

check();
