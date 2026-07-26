// assets/js/config.js
// ============================================
// NACOS Website - Global Configuration
// ============================================

// DO NOT put sensitive keys here if this file is public.
// For static sites, the Anon Key is safe to expose as long as RLS is properly configured.
window.SUPABASE_URL = "https://pnusmlckowqagnlzjqbv.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaGh2Ym5iYm1zdGZyaHRlZ3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzkwOTcsImV4cCI6MjA5MTc1NTA5N30.cSjwB9V-jY3yekNz0wS8EdlKG79lQr-SYPRj20eGicg";

// Optional: Analytics or other global settings
window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://your-backend.onrender.com/api';  // Update after deploy