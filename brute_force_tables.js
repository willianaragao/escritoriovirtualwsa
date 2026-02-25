import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxugtwqwqyojoyxnjhdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWd0d3F3cXlvam95eG5qaGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTQyMDYsImV4cCI6MjA2MjIzMDIwNn0.3NkA8dqmZLA6cSgrbfvjuzgbzVsTM20HN6lC8gExM08';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAllTables() {
    console.log('--- Brute Forcing Table Discovery ---');
    const potentialTables = [
        'profiles', 'user_profiles', 'accounts', 'members', 'settings',
        'config', 'metadata', 'audit_log', 'sessions', 'auth_users_public'
    ];

    for (const table of potentialTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Tabela descoberta: ${table}`);
            if (data.length > 0) {
                console.log(`Amostra:`, JSON.stringify(data[0], null, 2));
            }
        }
    }
    process.exit(0);
}

listAllTables();
