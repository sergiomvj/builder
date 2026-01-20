// Quick check if the 'tasks' table exists in Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTasksTable() {
  console.log('🔍 Checking personas_tasks table...\n');
  
  try {
    // Try to query the personas_tasks table
    const { data, error, count } = await supabase
      .from('personas_tasks')
      .select('*', { count: 'exact', head: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying personas_tasks table:', error.message);
      console.error('   Details:', error);
      console.log('\n💡 The table might not exist or might be named differently.');
      return;
    }
    
    console.log('✅ personas_tasks table exists!');
    console.log(`   Total tasks: ${count || 0}`);
    
    if (data && data.length > 0) {
      console.log('\n📋 Sample tasks:');
      data.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.title} (${task.status})`);
      });
    } else {
      console.log('   No tasks found in database (table is empty).');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkTasksTable();
