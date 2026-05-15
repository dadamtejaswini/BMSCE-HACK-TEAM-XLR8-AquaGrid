require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const email = process.argv[2] || 'admin@aquagrid.com';
  const password = process.argv[3] || 'password123';

  console.log(`🚀 Setting up admin: ${email}`);

  let userId;

  // 1. Check if user exists in Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log(`ℹ️ User already exists in Auth (ID: ${existingUser.id}). Promoting to admin...`);
    userId = existingUser.id;
  } else {
    console.log('✨ Creating new user in Auth...');
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      return;
    }
    userId = data.user.id;
    console.log(`✅ User created (ID: ${userId})`);
  }

  // 2. Insert/Update in public.users table
  console.log('Updating profile in public.users table...');
  
  // Try 'auth_id' variant
  const { error: err1 } = await supabase
    .from('users')
    .upsert({
      auth_id: userId,
      email: email,
      role: 'admin',
      name: 'Admin User'
    }, { onConflict: 'auth_id' });

  if (!err1) {
    console.log('✅ Success! (used auth_id column)');
  } else {
    if (err1.message.includes('Could not find the table')) {
      console.error('❌ Error: public.users table does not exist.');
      console.log('👉 ACTION REQUIRED: Open Supabase SQL Editor and run the script in supabase/complete_schema.sql');
      return;
    }

    console.log('Falling back to "id" column...');
    // Try 'id' variant
    const { error: err2 } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        role: 'admin',
        name: 'Admin User'
      }, { onConflict: 'id' });

    if (!err2) {
      console.log('✅ Success! (used id column)');
    } else {
      console.error('❌ Error updating profile:', err2.message);
      return;
    }
  }

  console.log('\n-----------------------------------');
  console.log('ADMIN ACCESS GRANTED');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('-----------------------------------');
}

run();
