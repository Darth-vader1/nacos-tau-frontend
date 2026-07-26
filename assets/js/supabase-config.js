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
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, delay * 2);
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
        console.log('User signed in');
        // Clear any cached admin check
        sessionStorage.removeItem('admin_role');
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        sessionStorage.clear();
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed');
    } else if (event === 'USER_UPDATED') {
        console.log('User updated');
        sessionStorage.removeItem('admin_role');
    }
});

window.supabase = supabase;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.checkAdmin = checkAdmin;
window.requireAdmin = requireAdmin;
window.signOut = signOut;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('✅ Supabase client initialized');
}