import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUser() {
    console.log('--- Verificando credenciais ---');
    const email = 'willianao84@gmail.com';
    const password = '24531104'; // Password provided by user

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('Erro ao buscar usuário:', error);
    } else if (data.length === 0) {
        console.log('Usuário não encontrado.');
    } else {
        console.log('Usuário encontrado:', JSON.stringify(data[0], null, 2));
        // Check if there is a password field
        if (data[0].senha || data[0].password) {
            console.log('Campo de senha existe:', data[0].senha || data[0].password);
        } else {
            console.log('Nenhum campo de senha encontrado no registro.');
        }
    }
    process.exit(0);
}

checkUser();
