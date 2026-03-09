import { supabase } from './src/lib/supabase.js';

async function testUpdate() {
    // Get the first record
    const { data: first, error: fErr } = await supabase.from('pedidos').select('id, numero_parcelas').limit(1).single();
    if (fErr) { console.error('Error fetching:', fErr); return; }

    console.log('Original record:', first);

    const newParc = (first.numero_parcelas || 0) + 1;
    console.log(`Setting numero_parcelas to: ${newParc}`);

    const { data, error } = await supabase
        .from('pedidos')
        .update({ numero_parcelas: newParc })
        .eq('id', first.id)
        .select();

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data[0].numero_parcelas === newParc);
        // Revert back
        await supabase.from('pedidos').update({ numero_parcelas: first.numero_parcelas }).eq('id', first.id);
        console.log('Reverted back.');
    }
}

testUpdate();
