// frontend/assets/js/homepage-cms.js
// Dynamically hydrates index.html (Hero, About, Current Executives, Payment & Inquiry details)
// from the backend /api/site-content endpoint (with Supabase anon fallback).
// Existing HTML in index.html acts as an instant zero-flash default if the DB isn't migrated yet.

import { supabase } from './supabase-config.js';

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeCmsUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('/assets/')
  ) {
    return trimmed;
  }
  return fallback;
}

function applySiteSettings(settings) {
  if (!settings || typeof settings !== 'object') return;
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && typeof val === 'string' && val.trim()) {
      el.textContent = val;
    }
  };

  setText('hero-title-prefix', settings.hero_title_prefix);
  setText('hero-title-highlight', settings.hero_title_highlight);
  setText('hero-subtitle', settings.hero_subtitle);
  setText('about-heading', settings.about_heading);
  setText('about-intro', settings.about_intro);

  if (Array.isArray(settings.about_bullets) && settings.about_bullets.length > 0) {
    const bulletsEl = document.getElementById('about-bullets');
    if (bulletsEl) {
      bulletsEl.innerHTML = settings.about_bullets
        .filter(b => typeof b === 'string' && b.trim())
        .map(b => `<li><i class="bi bi-check-circle"></i> <span>${escapeHtml(b)}</span></li>`)
        .join('');
    }
  }

  setText('exec-session-badge', settings.exec_session);
  setText('exec-subtitle', settings.exec_subtitle);

  setText('pay-account-number', settings.bank_account_number);
  setText('pay-account-name', settings.bank_account_name);
  setText('pay-bank-name', settings.bank_name);
  setText('pay-dues-amount', settings.dues_amount);
  setText('pay-note', settings.payment_note);
  setText('pay-ref-format', settings.payment_reference_format);

  const contactsEl = document.getElementById('pay-inquiry-contacts');
  if (contactsEl) {
    const email = (settings.contact_email || 'nacos@tau.edu.ng').trim();
    const links = Array.isArray(settings.inquiry_contacts) ? settings.inquiry_contacts : [];
    let html = `<a id="pay-contact-email" href="mailto:${escapeHtml(email)}" target="_blank">${escapeHtml(email)}</a> <br>`;
    links.forEach(c => {
      if (c && c.label && c.url) {
        const href = safeCmsUrl(c.url, '');
        if (href) {
          html += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.label)}</a> <br>`;
        }
      }
    });
    contactsEl.innerHTML = html;
  }
}

function renderDynamicExecutives(executives) {
  if (!Array.isArray(executives) || executives.length === 0) return;
  const container = document.getElementById('dynamicExecsContainer');
  if (!container) return;

  container.innerHTML = executives.map(exec => {
    const name = escapeHtml(exec.full_name || '');
    const role = escapeHtml(exec.portfolio || '');
    const photo = escapeHtml(safeCmsUrl(exec.photo_url, 'assets/img/nacos logo.jpg'));
    const linkedin = exec.linkedin_url ? safeCmsUrl(exec.linkedin_url, '') : '';
    return `
      <div class="col-lg-4" data-aos="zoom-in" data-aos-delay="100">
        <div class="pricing-item">
          <img class="img-fluid passport" src="${photo}" alt="${name}" width="400" height="560" loading="lazy" decoding="async" style="padding-bottom: 5%;" onerror="this.onerror=null;this.src='assets/img/nacos logo.jpg';">
          <h3 style="font-size: large;"><strong>${name}</strong></h3>
          <p class="description"><span style="color: #157a09;"><em>${role}</em></span></p>
          ${linkedin ? `<a href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer" class="cta-btn">LinkedIn<i class="bi bi-linkedin" style="opacity: 0.5;color: #157a09;padding-left: 5px;"></i></a>` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.AOS && typeof window.AOS.refresh === 'function') {
    window.AOS.refresh();
  }
}

async function loadSiteContent() {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = (window.__CONFIG?.apiUrl || (isLocal ? 'http://localhost:5000' : 'https://naco-tau-backend.vercel.app')).replace(/\/api\/?$/, '');
    let settings = null;
    let executives = [];

    try {
      const resp = await fetch(`${API_BASE_URL}/api/site-content`);
      if (resp.ok) {
        const json = await resp.json();
        settings = json?.data?.settings || null;
        executives = json?.data?.executives || [];
      }
    } catch (_) {
      // Fall back to direct Supabase anon read
    }

    if (!settings && (!executives || executives.length === 0)) {
      const [sRes, eRes] = await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('executives').select('*').eq('is_active', true).order('rank_order', { ascending: true }).order('full_name', { ascending: true })
      ]);
      if (!sRes.error && sRes.data) settings = sRes.data;
      if (!eRes.error && Array.isArray(eRes.data)) executives = eRes.data;
    }

    if (settings) applySiteSettings(settings);
    if (executives && executives.length > 0) renderDynamicExecutives(executives);
  } catch (err) {
    console.warn('Using default homepage content:', err?.message || err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSiteContent);
} else {
  loadSiteContent();
}
