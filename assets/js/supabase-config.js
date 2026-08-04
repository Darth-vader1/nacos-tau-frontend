import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Use window (set by env.js or config.local.js)
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your-project-id')) {
    const errorMsg = '❌ Supabase configuration missing or invalid!';
    console.error(errorMsg, { 
        url: SUPABASE_URL, 
        hasKey: !!SUPABASE_ANON_KEY 
    });
    
    // Attempt to notify the user if we are on a page with a preloader
    window.addEventListener('DOMContentLoaded', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.innerHTML = `
                <div style="color: white; text-align: center; padding: 20px; background: rgba(220, 53, 69, 0.9); border-radius: 10px;">
                    <h3>Configuration Error</h3>
                    <p>${errorMsg}</p>
                    <p>Please check your <code>env.js</code> or <code>config.local.js</code> file.</p>
                </div>
            `;
        }
    });
    
    throw new Error(errorMsg);
}

// Create client with production settings
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// ... rest of your functions (checkAuth, requireAuth, etc.)

// ============================================
// HELPER: Retry Logic
// ============================================

async function retryRequest(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, Math.min(delay * 2, 5000));
    }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Auth check failed:', error.message);
        return null;
    }
}

export async function requireAuth(redirectUrl = 'admin-login.html') {
    const session = await checkAuth();
    if (!session) {
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }
    
    // Check session expiry
    const expiresAt = session.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
        await supabase.auth.signOut();
        window.location.href = redirectUrl;
        return null;
    }
    
    return session;
}

export async function checkAdmin() {
    try {
        const session = await checkAuth();
        if (!session) return false;

        const { data, error } = await supabase
            .from('admin_users')
            .select('role, email, name, id')
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No admin record found
                return false;
            }
            console.error('Admin check error:', error.message);
            return false;
        }
        
        if (!data) return false;
        
        // Cache admin info for current session
        sessionStorage.setItem('admin_role', data.role);
        sessionStorage.setItem('admin_email', data.email);
        
        return true;
        
    } catch (error) {
        console.error('Admin check failed:', error);
        return false;
    }
}

export async function requireAdmin() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        const errorMessage = 'You do not have permission to access the admin panel.';
        
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                title: 'Access Denied',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'OK',
                timer: 3000
            });
        } else {
            alert(errorMessage);
        }
        
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

export async function signOut(redirectUrl = 'index.html') {
    try {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.removeItem('supabase.auth.token');
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('Sign out error:', error);
        // Force redirect even if sign out fails
        window.location.href = redirectUrl;
    }
}

// ============================================
// SESSION MONITORING
// ============================================

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        // Clear any cached admin check
        sessionStorage.removeItem('admin_role');
    } else if (event === 'SIGNED_OUT') {
        sessionStorage.clear();
    } else if (event === 'USER_UPDATED') {
        sessionStorage.removeItem('admin_role');
    }
});

// ============================================
// STORAGE HELPERS (bucket auto-creation + uploads)
//
// The project provisions 7 dedicated buckets in Supabase Storage:
//   past-questions    → PDF/doc past exam papers
//   timetables        → PDF/doc class schedules
//   resources         → misc academic resources files (doc/pdf)
//   event-images      → event banner/cover images
//   payment-proofs    → screenshots of bank/transfer receipts
//   profile-pictures  → student + admin avatar photos
//   voting-photos     → election candidate portraits
//
// BUCKET_MAP is the single source of truth: every caller passes a
// logical folder/flow key (e.g. "events", "past_questions") and the helper
// resolves to the exact bucket name created by the migrate script. Fallback
// is DEFAULT_BUCKET_NAME for any unknown folder (legacy paths).
// ============================================

export const BUCKET_MAP = Object.freeze({
  events: 'event-images',
  event_images: 'event-images',
  'event-images': 'event-images',
  past_questions: 'past-questions',
  'past-questions': 'past-questions',
  pastQuestions: 'past-questions',
  timetables: 'timetables',
  timetable: 'timetables',
  resources: 'resources',
  academic_resources: 'resources',
  'academic-resources': 'resources',
  profile_pictures: 'profile-pictures',
  'profile-pictures': 'profile-pictures',
  profile: 'profile-pictures',
  avatar: 'profile-pictures',
  payment_proofs: 'payment-proofs',
  'payment-proofs': 'payment-proofs',
  payment: 'payment-proofs',
  voting_photos: 'voting-photos',
  'voting-photos': 'voting-photos',
  voting: 'voting-photos',
  candidates: 'voting-photos'
});

/**
 * Resolve a logical folder / flow key to the dedicated Supabase bucket name.
 * Falls back to DEFAULT_BUCKET_NAME when no mapping exists so legacy callers
 * keep working (ensureBucket will still validate/create the fallback bucket).
 */
export function resolveBucketFor(folderOrKey, fallback = DEFAULT_BUCKET_NAME) {
  if (!folderOrKey) return fallback;
  const key = String(folderOrKey).trim().toLowerCase();
  if (BUCKET_MAP[key]) return BUCKET_MAP[key];
  if (Object.values(BUCKET_MAP).includes(key)) return key;
  return fallback;
}

export const DEFAULT_BUCKET_NAME = (window.__CONFIG?.storageBucket || window.SUPABASE_STORAGE_BUCKET || 'nacos-assets').trim();

const ensuredBuckets = new Set();

const VERIFIED_BUCKETS_KEY = 'verifiedBuckets-v1';
const VERIFIED_BUCKETS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function readVerifiedBuckets() {
  try {
    const raw = localStorage.getItem(VERIFIED_BUCKETS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.buckets) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > VERIFIED_BUCKETS_TTL_MS) return null;
    return new Set(parsed.buckets.filter(b => typeof b === 'string'));
  } catch {
    return null;
  }
}

export function writeVerifiedBuckets(bucketNames) {
  if (!Array.isArray(bucketNames)) return;
  const clean = bucketNames.filter(b => typeof b === 'string' && b.length > 0);
  try {
    localStorage.setItem(VERIFIED_BUCKETS_KEY, JSON.stringify({
      buckets: clean,
      ts: Date.now()
    }));
  } catch { /* localStorage disabled — ignore */ }
}

export async function ensureBucket(bucketName = DEFAULT_BUCKET_NAME) {
  if (!bucketName) throw new Error('Bucket name is required');
  if (ensuredBuckets.has(bucketName)) return bucketName;

  const verified = readVerifiedBuckets();
  if (verified && verified.has(bucketName)) {
    ensuredBuckets.add(bucketName);
    return bucketName;
  }

  // No verified cache entry, or bucket not in it — still proceed WITHOUT
  // calling the anon storage admin endpoints. The real upload() call is the
  // canonical source of truth for "bucket does not exist".
  ensuredBuckets.add(bucketName);
  if (!verified) {
    console.warn(
      `[storage] ensureBucket("${bucketName}"): no verified bucket cache yet. ` +
      `Hint: admin dashboard init runs POST /api/storage/ensure-buckets to populate this for 24h. ` +
      `Proceeding with upload without preflight.`
    );
  } else {
    console.warn(
      `[storage] ensureBucket("${bucketName}"): bucket not in verified list (${[...verified].join(', ')}). ` +
      `If this upload fails with a storage-level error, run POST /api/storage/ensure-buckets via the dashboard Admin menu.`
    );
  }
  return bucketName;
}

/**
 * Upload a single File object to Supabase Storage with automatic
 * bucket resolution + ensure + sanitized unique filenames + retry logic.
 *
 * Pass the logical flow as `folder` (e.g. "events", "past_questions",
 * "profile-pictures") — `resolveBucketFor` maps it to the dedicated bucket.
 * Only pass `bucketName` explicitly when you need to override the map.
 *
 * Returns { fileUrl, filePath, fileName, bucket } so callers can write
 * the public URL into their DB row immediately.
 */
export async function uploadFileToStorage(folder, file, bucketName, options = {}) {
  if (!file || !(file instanceof Blob)) throw new Error('A file is required for upload.');
  if (!folder || typeof folder !== 'string') throw new Error('An upload folder is required (e.g. "past_questions").');
  
  const { retries = 2, onProgress } = options;
  const resolvedBucket = bucketName || resolveBucketFor(folder);
  const bucket = await ensureBucket(resolvedBucket);

  const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'bin';
  const safeName = (file.name || `${Date.now()}`)
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  const filePath = `${folder.replace(/\/+$/g, '')}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${safeName}`;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (onProgress) onProgress(`Uploading... (attempt ${attempt + 1}/${retries + 1})`);
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { 
          cacheControl: '31536000', 
          upsert: false
        });
        
      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return {
        fileUrl: urlData.publicUrl,
        filePath,
        fileName: safeName,
        bucket
      };
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const hint = /bucket/i.test(lastError.message || '') 
    ? ` (bucket used: "${bucket}", resolved from folder "${folder}")` 
    : '';
  throw new Error(`Upload failed after ${retries + 1} attempts: ${lastError.message}${hint}`);
}

window.supabase = supabase;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.checkAdmin = checkAdmin;
window.requireAdmin = requireAdmin;
window.signOut = signOut;
window.DEFAULT_BUCKET_NAME = DEFAULT_BUCKET_NAME;
window.BUCKET_MAP = BUCKET_MAP;
window.resolveBucketFor = resolveBucketFor;
window.writeVerifiedBuckets = writeVerifiedBuckets;
window.ensureBucket = ensureBucket;
window.uploadFileToStorage = uploadFileToStorage;

// Keep client initialization silent in production.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('✅ Supabase client initialized');
}