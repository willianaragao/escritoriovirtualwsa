import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findAdriano() {
    const { data: pedidos } = await supabase.from('pedidos').select('*').eq('cliente_id', '4ed5a9d3-42ab-425f-9c3b-71a7e4f53d09').eq('data_pedido', '2026-02-09');
    console.log(JSON.stringify(pedidos, null, 2));
    process.exit(0);
}

findAdriano();
