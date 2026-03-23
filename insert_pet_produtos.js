import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxugtwqwqyojoyxnjhdw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08'
);

const userId = '027e57cb-3f96-43b3-9eee-954988f784e5';

const produtosPET = [
  { user_id: userId, nome: '500ml REDONDA PET', custo_producao: 55, preco_unitario: 65, tipo: 'un' },
  { user_id: userId, nome: '500 ML PET QUADRADA', custo_producao: 55, preco_unitario: 65, tipo: 'un' },
  { user_id: userId, nome: '300ml REDONDA PET', custo_producao: 53, preco_unitario: 63, tipo: 'un' },
  { user_id: userId, nome: '200ml REDONDA PET', custo_producao: 52, preco_unitario: 62, tipo: 'un' },
  { user_id: userId, nome: '1 LITRO PET', custo_producao: 35, preco_unitario: 47.50, tipo: 'un' }
];

async function insert() {
  for(let p of produtosPET) {
     const { data, error } = await supabase.from('produtos').select('id').eq('nome', p.nome);
     if(data && data.length > 0) {
        // update
        await supabase.from('produtos').update({ custo_producao: p.custo_producao, preco_unitario: p.preco_unitario }).eq('id', data[0].id);
     } else {
        await supabase.from('produtos').insert([p]);
     }
  }
  console.log("Done");
}
insert();
