import { createClient } from '@supabase/supabase-js';
const s = createClient('https://cxugtwqwqyojoyxnjhdw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08');

const p = await s.from('produtos').select('*').limit(3);
const pp = await s.from('pedidos_produtos').select('*').limit(3);

console.log('PRODUTOS cols:', Object.keys(p.data?.[0] || {}));
console.log('PRODUTOS[0]:', JSON.stringify(p.data?.[0]));
console.log('PRODUTOS[1]:', JSON.stringify(p.data?.[1]));
console.log('PEDIDOS_PRODUTOS cols:', Object.keys(pp.data?.[0] || {}));
console.log('PEDIDOS_PRODUTOS[0]:', JSON.stringify(pp.data?.[0]));
if (p.error) console.error('erro produtos', p.error);
if (pp.error) console.error('erro pedidos_produtos', pp.error);
process.exit(0);
