
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    console.log('Testing insert with minimal payload...');
    const payload = {
        data: new Date().toISOString().split('T')[0],
        valor: 100,
        quantidade: 2,
        unidade: 'sacos',
        preco_por_kg: 10,
        descricao: 'Teste de Inserção',
        fornecedor: 'Teste'
    };

    const { data, error } = await supabase.from('gastos_materia_prima').insert([payload]).select();
    if (error) {
        console.error('INSERT ERROR:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}
testInsert();
