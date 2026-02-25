import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllUsers() {
    console.log('--- Buscando todos os usuários ---');
    const { data, error } = await supabase
        .from('usuarios')
        .select('*');

    if (error) {
        console.error('Erro ao buscar usuários:', error);
    } else {
        console.log('Usuários encontrados:', JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

getAllUsers();
