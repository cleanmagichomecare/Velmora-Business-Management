// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://izcuwepzeqhfnjcmpekz.supabase.co';       // e.g. https://xyzproject.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Y3V3ZXB6ZXFoZm5qY21wZWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTA2MDcsImV4cCI6MjA5MDUyNjYwN30.jvDkD4aFoOmlpotWZxnxuwztN_4hvyJsDQ9c9ep9hLw'; // Your anon/public key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
