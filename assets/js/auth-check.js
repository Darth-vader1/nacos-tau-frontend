import { checkAuth } from './supabase-config.js';

export async function requireStudentAuth(redirectUrl = 'student-login.html') {
    const session = await checkAuth();
    if (!session) {
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = redirectUrl;
        return null;
    }

    const expiresAt = session.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
        const { supabase } = await import('./supabase-config.js');
        await supabase.auth.signOut();
        window.location.href = redirectUrl;
        return null;
    }

    return session;
}
