import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxugtwqwqyojoyxnjhdw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08'
);

async function check() {
  const t1 = await supabase.from('pedidos').select('*').limit(1);
  console.log("PEDIDOS:", JSON.stringify(t1.data, null, 2));

  const t2 = await supabase.from('pedidos_produtos').select('*').limit(1);
  console.log("PEDIDOS_PRODUTOS:", JSON.stringify(t2.data, null, 2));

  const t3 = await supabase.from('parcelas').select('*').limit(1);
  console.log("PARCELAS:", JSON.stringify(t3.data, null, 2));
}
check();
