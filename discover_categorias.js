import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function discoverCategorias() {
    console.log('--- Descobrindo Schema da tabela categorias ---');

    const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Erro:', error);
        // Tentar outra tabela se 'categorias' falhar (vi categoria_trasacoes antes)
        console.log('Tentando "categoria_trasacoes" como fallback...');
        const { data: data2, error: error2 } = await supabase
            .from('categoria_trasacoes')
            .select('*')
            .limit(1);

        if (error2) {
            console.error('Erro no fallback:', error2);
        } else if (data2 && data2.length > 0) {
            console.log('Colunas de categoria_trasacoes:', Object.keys(data2[0]));
            if (data2[0]) console.log('Amostra de dados:', data2[0]);
        }
    } else if (data && data.length > 0) {
        console.log('Colunas de categorias:', Object.keys(data[0]));
        if (data[0]) console.log('Amostra de dados:', data[0]);
    } else {
        console.log('Tabela categorias existe mas está vazia.');
        // Tentativa de ver colunas via select de colunas comuns
        const { error: testError } = await supabase.from('categorias').select('id, nome, icone, cor').limit(0);
        if (!testError) console.log('Colunas inferidas: id, nome, icone, cor');
    }
    process.exit(0);
}

discoverCategorias();
