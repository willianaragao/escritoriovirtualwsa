
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable() {
    console.log('Inspecting gastos_materia_prima...');
    const { data, error } = await supabase.from('gastos_materia_prima').select('*').limit(1);
    if (error) {
        console.log('Error:', error.code, error.message);
    } else {
        console.log('Table structure (first row):', JSON.stringify(data[0], null, 2));
    }
}
inspectTable();
