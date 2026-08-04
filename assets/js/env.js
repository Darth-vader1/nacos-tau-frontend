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

// Supabase Storage bucket used for past questions, timetables, event images,
// and other uploaded assets. Must match the bucket name in the Supabase project
// (Storage → Browse). If the bucket doesn't exist and "Allow new public buckets"
// is enabled, the frontend will auto-create it on first upload.
window.SUPABASE_STORAGE_BUCKET = 'nacos-assets';

// Exact names of the 7 dedicated buckets provisioned in the Supabase project.
// The resolveBucketFor() helper maps logical flow folders to these names so
// uploads never land in the legacy monolithic bucket by accident.
window.SUPABASE_DEDICATED_BUCKETS = Object.freeze({
  pastQuestions: 'past-questions',
  timetables: 'timetables',
  resources: 'resources',
  eventImages: 'event-images',
  paymentProofs: 'payment-proofs',
  profilePictures: 'profile-pictures',
  votingPhotos: 'voting-photos'
});

// ============================================
// LOGGING
// ============================================

// Production logging is intentionally silent to avoid exposing sensitive
// environment details in the browser console.

window.__CONFIG = {
    supabaseUrl: window.SUPABASE_URL,
    supabaseAnonKey: window.SUPABASE_ANON_KEY,
    apiUrl: window.API_URL,
    storageBucket: window.SUPABASE_STORAGE_BUCKET,
    dedicatedBuckets: window.SUPABASE_DEDICATED_BUCKETS,
    bucketMap: {
        events: 'event-images',
        past_questions: 'past-questions',
        timetables: 'timetables',
        resources: 'resources',
        academic_resources: 'resources',
        profile_pictures: 'profile-pictures',
        payment_proofs: 'payment-proofs',
        voting_photos: 'voting-photos'
    },
    environment: isLocal ? 'development' : 'production'
};