import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxugtwqwqyojoyxnjhdw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08'
);

const MAPPING = {
  '500ml REDONDA PET': '500ml Pet Redonda c/100',
  '500 ML PET QUADRADA': '500ml Pet Quadrada c/100',
  '300ml REDONDA PET': '300ml Pet Redonda c/100',
  '200ml REDONDA PET': '200ml Pet Redonda c/100',
  '1 LITRO PET': '1Litro Pet Redonda c/50'
};

async function updateNames() {
  for (const [oldName, newName] of Object.entries(MAPPING)) {
    const { data, error } = await supabase.from('produtos').update({ nome: newName }).eq('nome', oldName);
    if(error) console.error(error);
  }
  console.log("Renamed successfully");
}

updateNames();
