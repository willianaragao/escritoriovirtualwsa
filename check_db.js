import { supabase } from './src/lib/supabase.js';

async function checkDividas() {
    const { data, error } = await supabase
        .from('dividas_fixas_wsa')
        .select('*')
        .limit(20);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Records:', JSON.stringify(data, null, 2));
    }
}

checkDividas();
