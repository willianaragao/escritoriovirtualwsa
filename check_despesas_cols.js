import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { error: err1 } = await supabase.from('despesas').select('business_unit').limit(1);
  console.log('despesas error:', err1 ? err1.message : 'No error - column exists');
  
  const { error: err2 } = await supabase.from('dividas_fixas').select('business_unit').limit(1);
  console.log('dividas_fixas error:', err2 ? err2.message : 'No error - column exists');
}

check();
