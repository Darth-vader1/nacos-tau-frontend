// assets/js/config.js
// ============================================
// NACOS Website - Global Configuration
// ============================================

// DO NOT put sensitive keys here if this file is public.
// For static sites, the Anon Key is safe to expose as long as RLS is properly configured.
window.SUPABASE_URL = "https://pnusmlckowqagnlzjqbv.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudXNtbGNrb3dxYWdubHpqcWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDc4OTcsImV4cCI6MjEwMDU4Mzg5N30.W2AqKT-MZSWl-uF1guqJYrMfYL3MNxPb-58zdKa5kdM"

console.log('🌍 Loading environment variables...');

// ============================================
// SUPABASE CONFIGURATION
// ============================================
// ============================================
// API CONFIGURATION
// ============================================

// Determine API URL based on environment
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '';

window.API_URL = isLocal 
    ? 'http://localhost:5000/api'
    : 'https://nacos-backend.up.railway.app/api';

// ============================================
// LOGGING
// ============================================

console.log('✅ Environment loaded');
console.log('🔗 Supabase URL:', window.SUPABASE_URL);
console.log('🔑 Supabase Anon Key:', window.SUPABASE_ANON_KEY ? '✅ Set (starts with sb_publishable)' : '❌ Missing');
console.log('🔗 API URL:', window.API_URL);
console.log('📡 Environment:', isLocal ? 'Development' : 'Production');

window.__CONFIG = {
    supabaseUrl: window.SUPABASE_URL,
    supabaseAnonKey: window.SUPABASE_ANON_KEY,
    apiUrl: window.API_URL,
    environment: isLocal ? 'development' : 'production'
};