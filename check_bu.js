import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxugtwqwqyojoyxnjhdw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08'
);

async function check() {
  const { error } = await supabase.from('pedidos').update({ business_unit: 'PEAD' }).eq('id', '8c7c7fc4-698e-4868-9cde-160f13ce68ac');
  console.log("Error:", error);
}
check();
