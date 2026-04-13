/**
 * supabase-config.js
 * Initializes the Supabase client using the CDN (UMD) build.
 * 
 * The CDN script (loaded before this file in index.html) exposes a global
 * `supabase` object with a `createClient` method.
 * 
 * We destructure `createClient` from that global, create the client,
 * and assign it to `window.supabase` so every other script can use
 * `supabase.from(...)` directly.
 */

// ─── Supabase Credentials ───
const SUPABASE_URL = 'https://izcuwepzeqhfnjcmpekz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Y3V3ZXB6ZXFoZm5qY21wZWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTA2MDcsImV4cCI6MjA5MDUyNjYwN30.jvDkD4aFoOmlpotWZxnxuwztN_4hvyJsDQ9c9ep9hLw';

// ─── Initialize Client ───
// The CDN <script> tag puts a global `supabase` object in window scope.
// We grab `createClient` from it BEFORE overwriting the name.
const { createClient } = supabase;

// Create the actual Supabase client and make it globally available.
// After this line, `window.supabase` (and therefore just `supabase` in
// any classic <script>) is the initialized client with `.from()`, etc.
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized successfully');
