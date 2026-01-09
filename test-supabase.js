const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ycisxbdqddbcwhmyhljo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXN4YmRxZGRiY3dobXlobGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Mzg0NjYsImV4cCI6MjA4MzUxNDQ2Nn0.gopzDelYN-VxyupKt90eTAcffz6Ey_zlZ9R7DaLmb5U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! Products:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testConnection();
