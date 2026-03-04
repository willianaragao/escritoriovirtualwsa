import { supabase } from './src/lib/supabase.js';

async function standardizeLight() {
    console.log('Fetching existing Light records...');
    const { data: lights, error: fetchErr } = await supabase
        .from('dividas_fixas_wsa')
        .select('*')
        .ilike('descricao', '%Light%');

    if (fetchErr) {
        console.error('Error fetching Light records:', fetchErr);
        return;
    }

    console.log(`Found ${lights.length} records.`);

    // 1. Delete all existing Light records to start fresh
    const idsToDelete = lights.map(l => l.id);
    if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase
            .from('dividas_fixas_wsa')
            .delete()
            .in('id', idsToDelete);

        if (delErr) {
            console.error('Error deleting duplicates:', delErr);
            return;
        }
        console.log('Duplicates deleted.');
    }

    // 2. Insert the MASTER Light record (mes_referencia: null)
    const masterLight = {
        user_id: '027e57cb-3f96-43b3-9eee-954988f784e5', // Based on check_db.js
        descricao: 'Light',
        categoria: 'Fixa',
        tipo: 'mensal',
        valor: 1000,
        vencimento: 30,
        paga: false, // Start as open for todos os meses
        ativa: true,
        mes_referencia: null // MASTER Record
    };

    const { error: insErr } = await supabase
        .from('dividas_fixas_wsa')
        .insert([masterLight]);

    if (insErr) {
        console.error('Error inserting master Light:', insErr);
    } else {
        console.log('Master Light record created successfully (recurring for all months).');
    }
}

standardizeLight();
