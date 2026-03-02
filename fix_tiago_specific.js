
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixTiago() {
    const orderId = '0b78f167-bc3c-4579-ad3b-845b3b705b33';

    const { data: order } = await supabase.from('pedidos').select('*').eq('id', orderId).single();

    if (order) {
        const { error } = await supabase
            .from('pedidos')
            .update({
                status: 'pago',
                mes_referencia: 'Janeiro',
                parcelas_pagas: order.numero_parcelas || 4,
                condicoes_pagamento: {
                    ...(order.condicoes_pagamento || {}),
                    valor_recebido: order.valor_total
                }
            })
            .eq('id', orderId);

        if (error) console.error(error);
        else console.log('Fixed Tiago Curicica order BEB4 to PAGO in Janeiro.');
    } else {
        console.log('Tiago order not found.');
    }
}
fixTiago();
