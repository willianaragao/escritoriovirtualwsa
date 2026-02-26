import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncAll() {
    console.log('--- Iniciando Sincronização em Massa ---');

    // 1. Tiago Curicica
    // ID: 0b78f167-bc3c-4579-ad3b-845b3b705b33
    // 4 parcelas de 2025. Parcela 2 em 21/02 implies Parcela 1 em 14/02 (7 days interval)
    await supabase.from('pedidos').update({
        numero_parcelas: 4,
        parcelas_pagas: 1, // Parcela 1 was 14/02, Parcela 2 is 21/02 (vencida)
        condicoes_pagamento: {
            formaPagamento: 'dinheiro',
            numeroParcelas: 4,
            dataPrimeiraParcela: '2026-02-14',
            intervaloDias: 7
        }
    }).eq('id', '0b78f167-bc3c-4579-ad3b-845b3b705b33');
    console.log('✓ Tiago Curicica atualizado (Vencido em 21/02)');

    // 2. Ninil Bonsucesso
    // ID: 824f1428-8a15-4c86-b409-69d1192f3905
    // 2 parcelas. Parcela 1 em 25/02.
    await supabase.from('pedidos').update({
        numero_parcelas: 2,
        parcelas_pagas: 0,
        condicoes_pagamento: {
            formaPagamento: 'pix',
            numeroParcelas: 2,
            dataPrimeiraParcela: '2026-02-25',
            intervaloDias: 30
        }
    }).eq('id', '824f1428-8a15-4c86-b409-69d1192f3905');
    console.log('✓ Ninil Bonsucesso atualizado (Vence hoje)');

    // 3. Fabio Atacadao marechal
    // ID: 0193e20b-b045-4af0-9623-2621ccf77454
    // Parcela 2 em 25/02. Total 440. 
    await supabase.from('pedidos').update({
        numero_parcelas: 2,
        parcelas_pagas: 1,
        condicoes_pagamento: {
            formaPagamento: 'pix',
            numeroParcelas: 2,
            dataPrimeiraParcela: '2026-02-18', // 7 days interval means Parcela 2 is 25/02
            intervaloDias: 7
        }
    }).eq('id', '0193e20b-b045-4af0-9623-2621ccf77454');
    console.log('✓ Fabio Atacadao atualizado (Vence hoje)');

    // 4. Sorritz
    // ID: 2ba26aba-0f10-47c7-9a86-41a49bbb8afc
    // 4 parcelas. Parcela 1 em 28/02.
    await supabase.from('pedidos').update({
        numero_parcelas: 4,
        parcelas_pagas: 0,
        condicoes_pagamento: {
            formaPagamento: 'dinheiro',
            numeroParcelas: 4,
            dataPrimeiraParcela: '2026-02-28',
            intervaloDias: 30
        }
    }).eq('id', '2ba26aba-0f10-47c7-9a86-41a49bbb8afc');
    console.log('✓ Sorritz atualizado (Vence em 28/02)');

    // 5. Cleanup: Removendo pedidos "fantasmas" do calendário
    // Qualquer pedido que não seja esses 4 ou o Adriano Mercadao (já sincronizado) 
    // e que esteja constando como vencido indevidamente.
    // Vamos zerar o numero_parcelas de quem está "A Receber" mas sem condicoes_pagamento reais.

    // Pegar IDs permitidos
    const allowedIds = [
        '0b78f167-bc3c-4579-ad3b-845b3b705b33', // Tiago
        '824f1428-8a15-4c86-b409-69d1192f3905', // Ninil
        '0193e20b-b045-4af0-9623-2621ccf77454', // Fabio
        '2ba26aba-0f10-47c7-9a86-41a49bbb8afc', // Sorritz
        '1c85194e-72dc-4078-9e6c-cb225aa602bc'  // Adriano (já feito)
    ];

    const { data: others } = await supabase.from('pedidos')
        .select('id, cliente_id, clientes(nome)')
        .not('id', 'in', `(${allowedIds.join(',')})`)
        .in('status', ['a_receber', 'pendente']);

    console.log(`\nLimpando ${others?.length || 0} pedidos sem cronograma real...`);

    if (others) {
        for (const p of others) {
            // Zeramos o numero_parcelas para que o filtro do Calendário (numParc > 0) os ignore
            await supabase.from('pedidos').update({
                numero_parcelas: 0,
                condicoes_pagamento: null
            }).eq('id', p.id);
        }
    }

    console.log('\n--- Sincronização Concluída ---');
    process.exit(0);
}

syncAll();
