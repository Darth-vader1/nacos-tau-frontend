// assets/js/nav-auth.js
// Shows members-only navigation to signed-in students and guest links
// (e.g. "Sign In") to everyone else, on pages that guests can visit.
//
// Markup:
//   <li data-members-only hidden>...</li>   hidden until a session is found
//   <li data-guest-only>...</li>            removed once a session is found
//
// Members-only items start hidden, so guests never see them flash on load.
import { supabase } from './supabase-config.js';

async function applyNavAuth() {
  let signedIn = false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    signedIn = !!session;
  } catch (_) {
    signedIn = false; // stay in the guest view if the check fails
  }

  document.querySelectorAll('[data-members-only]').forEach(el => { el.hidden = !signedIn; });
  document.querySelectorAll('[data-guest-only]').forEach(el => { el.hidden = signedIn; });
}

applyNavAuth();
supabase.auth.onAuthStateChange(() => applyNavAuth());
