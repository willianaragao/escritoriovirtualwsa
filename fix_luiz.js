
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixLuiz() {
    const orderId = '8819f11e-f5df-42f2-ad3c-0bf341c3cc54';

    const { data: order } = await supabase.from('pedidos').select('*').eq('id', orderId).single();

    if (order) {
        // Ajustando para ser 2 parcelas (1850 cada), com 1 paga.
        // Isso totaliza 1850 pago e 1850 pendente.
        const { error } = await supabase
            .from('pedidos')
            .update({
                status: 'parcialmente_pago',
                numero_parcelas: 2,
                parcelas_pagas: 1,
                condicoes_pagamento: {
                    ...(order.condicoes_pagamento || {}),
                    numeroParcelas: 2,
                    valor_recebido: 1850
                }
            })
            .eq('id', orderId);

        if (error) console.error(error);
        else console.log('Corrigido: Luiz bras de pina agora tem 1 de 2 parcelas pagas (Total R$ 1850 pago).');
    }
}
fixLuiz();
