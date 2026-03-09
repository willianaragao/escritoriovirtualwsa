import { supabase } from './src/lib/supabase.js';

async function checkSchema() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in pedidos:', Object.keys(data[0]));
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No records found in pedidos table.');
    }
}

checkSchema();
