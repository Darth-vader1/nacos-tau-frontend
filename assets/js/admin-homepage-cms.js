// frontend/assets/js/admin-homepage-cms.js
// Admin Dashboard CMS for index.html (Current Executives + Site Copy & Payment Info)

import { checkAuth, uploadFileToStorage } from './supabase-config.js';
import { api } from './api-config.js?v=2.3';

let currentExecsList = [];
let currentSiteSettings = null;

function esc(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function getAdminHelpers() {
  return {
    apiAdmin: window.apiAdmin,
    logAdminAction: window.logAdminAction
  };
}

export async function loadHomepageCms() {
  const tbody = document.getElementById('current-execs-table-body');
  const warningBanner = document.getElementById('cms-migration-warning');
  if (!tbody) return;

  try {
    const [contentRes, allExecsRes] = await Promise.all([
      api.siteContent.get(),
      api.siteContent.getAllExecutives()
    ]);

    const tableMissing = Boolean(allExecsRes?.data?.tableMissing);
    if (warningBanner) {
      warningBanner.style.display = tableMissing ? 'block' : 'none';
    }

    currentExecsList = Array.isArray(allExecsRes?.data?.executives)
      ? allExecsRes.data.executives
      : (Array.isArray(contentRes?.data?.executives) ? contentRes.data.executives : []);

    currentSiteSettings = contentRes?.data?.settings || null;

    renderCurrentExecsTable();
    populateSiteSettingsForm(currentSiteSettings);
  } catch (err) {
    console.error('[loadHomepageCms] Error:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load homepage CMS data: ${esc(err.message)}</td></tr>`;
  }
}

function renderCurrentExecsTable() {
  const tbody = document.getElementById('current-execs-table-body');
  const countEl = document.getElementById('currentExecsResultsInfo');
  if (!tbody) return;

  const q = (document.getElementById('currentExecSearchInput')?.value || '').trim().toLowerCase();
  const filtered = currentExecsList.filter(item => {
    if (!q) return true;
    return (
      String(item.full_name || '').toLowerCase().includes(q) ||
      String(item.portfolio || '').toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">${
      currentExecsList.length === 0
        ? 'No current executives found. Run migration 027 or click <strong>Add Executive</strong>.'
        : 'No executives match your search.'
    }</td></tr>`;
    if (countEl) countEl.textContent = `Showing 0 of ${currentExecsList.length} executives`;
    return;
  }

  tbody.innerHTML = filtered.map(exec => {
    const photo = exec.photo_url || 'assets/img/nacos logo.jpg';
    const activeBadge = exec.is_active !== false
      ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Visible</span>'
      : '<span class="badge bg-secondary-subtle text-secondary border">Hidden</span>';
    const linkedinHtml = exec.linkedin_url
      ? `<a href="${esc(exec.linkedin_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary"><i class="bi bi-linkedin"></i></a>`
      : '<span class="text-muted small">—</span>';

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${esc(photo)}" alt="${esc(exec.full_name)}" class="rounded-circle object-fit-cover border" style="width:40px;height:40px;" onerror="this.onerror=null;this.src='assets/img/nacos logo.jpg';">
            <span class="fw-semibold">${esc(exec.full_name)}</span>
          </div>
        </td>
        <td><span class="text-success fw-medium">${esc(exec.portfolio)}</span></td>
        <td><span class="badge bg-light text-dark border">#${esc(exec.rank_order ?? 10)}</span></td>
        <td>${activeBadge}</td>
        <td>${linkedinHtml}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary" onclick="editCurrentExecutive('${esc(exec.id)}')" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-outline-danger" onclick="deleteCurrentExecutive('${esc(exec.id)}')" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${currentExecsList.length} executives`;
}

function addInquiryContactRow(label = '', url = '') {
  const container = document.getElementById('cms-inquiry-contacts-list');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center mb-2 cms-contact-row';
  row.innerHTML = `
    <div class="col-md-5">
      <input type="text" class="form-control form-control-sm cms-contact-label" placeholder="Role / Label (e.g. The President)" value="${esc(label)}">
    </div>
    <div class="col-md-6">
      <input type="url" class="form-control form-control-sm cms-contact-url" placeholder="https://wa.me/..." value="${esc(url)}">
    </div>
    <div class="col-md-1 text-end">
      <button type="button" class="btn btn-sm btn-outline-danger remove-contact-btn" title="Remove">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  `;
  row.querySelector('.remove-contact-btn')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function populateSiteSettingsForm(settings) {
  if (!settings) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  setVal('cms-hero-prefix', settings.hero_title_prefix);
  setVal('cms-hero-highlight', settings.hero_title_highlight);
  setVal('cms-hero-subtitle', settings.hero_subtitle);
  setVal('cms-about-heading', settings.about_heading);
  setVal('cms-about-intro', settings.about_intro);

  const bullets = Array.isArray(settings.about_bullets) ? settings.about_bullets : [];
  setVal('cms-about-bullet-1', bullets[0] || '');
  setVal('cms-about-bullet-2', bullets[1] || '');
  setVal('cms-about-bullet-3', bullets[2] || '');

  setVal('cms-exec-session', settings.exec_session);
  setVal('cms-exec-subtitle', settings.exec_subtitle);

  setVal('cms-bank-name', settings.bank_name);
  setVal('cms-account-number', settings.bank_account_number);
  setVal('cms-account-name', settings.bank_account_name);
  setVal('cms-dues-amount', settings.dues_amount);
  setVal('cms-payment-note', settings.payment_note);
  setVal('cms-payment-ref', settings.payment_reference_format);
  setVal('cms-contact-email', settings.contact_email);

  const contactsList = document.getElementById('cms-inquiry-contacts-list');
  if (contactsList) {
    contactsList.innerHTML = '';
    const links = Array.isArray(settings.inquiry_contacts) ? settings.inquiry_contacts : [];
    links.forEach(c => addInquiryContactRow(c.label || '', c.url || ''));
  }
}

window.resetCurrentExecutiveForm = function() {
  const form = document.getElementById('addCurrentExecutiveForm');
  if (form) form.reset();
  const idEl = document.getElementById('ce-id');
  if (idEl) idEl.value = '';
  const activeEl = document.getElementById('ce-active');
  if (activeEl) activeEl.checked = true;
  const titleEl = document.getElementById('ce-modal-title');
  if (titleEl) titleEl.innerHTML = '<i class="bi bi-person-badge me-2"></i>Add Current Executive';
  const btnEl = document.getElementById('ce-submit-btn');
  if (btnEl) btnEl.textContent = 'Save Executive';
};

window.editCurrentExecutive = function(id) {
  const item = currentExecsList.find(x => String(x.id) === String(id));
  if (!item) return;

  window.resetCurrentExecutiveForm();
  document.getElementById('ce-id').value = item.id;
  document.getElementById('ce-full-name').value = item.full_name || '';
  document.getElementById('ce-portfolio').value = item.portfolio || '';
  document.getElementById('ce-rank').value = item.rank_order ?? 10;
  document.getElementById('ce-linkedin').value = item.linkedin_url || '';
  document.getElementById('ce-photo-url').value = item.photo_url || '';
  document.getElementById('ce-active').checked = item.is_active !== false;

  document.getElementById('ce-modal-title').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Current Executive';
  document.getElementById('ce-submit-btn').textContent = 'Update Executive';

  const modalEl = document.getElementById('addCurrentExecutiveModal');
  if (modalEl && window.bootstrap) {
    window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
};

window.deleteCurrentExecutive = async function(id) {
  const item = currentExecsList.find(x => String(x.id) === String(id));
  const name = item ? item.full_name : 'this executive';

  const result = await Swal.fire({
    title: 'Remove Executive?',
    text: `Are you sure you want to remove "${name}" from the homepage?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, remove'
  });

  if (!result.isConfirmed) return;

  try {
    const { apiAdmin, logAdminAction } = getAdminHelpers();
    await apiAdmin.remove('executives', id);
    if (logAdminAction) await logAdminAction('DELETE', 'executive', id, { name });
    Swal.fire('Removed', 'Executive removed from homepage.', 'success');
    await loadHomepageCms();
  } catch (err) {
    console.error('[deleteCurrentExecutive] Error:', err);
    Swal.fire('Error', err.message || 'Failed to remove executive', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentExecSearchInput')?.addEventListener('input', renderCurrentExecsTable);
  document.getElementById('cms-add-contact-btn')?.addEventListener('click', () => addInquiryContactRow('', ''));

  document.getElementById('addCurrentExecutiveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const session = await checkAuth();
    if (!session) return;

    const ceId = document.getElementById('ce-id').value;
    const fullName = document.getElementById('ce-full-name').value.trim();
    const portfolio = document.getElementById('ce-portfolio').value.trim();
    const rankOrder = parseInt(document.getElementById('ce-rank').value, 10) || 10;
    const linkedinUrl = document.getElementById('ce-linkedin').value.trim() || null;
    const isActive = document.getElementById('ce-active').checked;
    const photoFileInput = document.getElementById('ce-photo-file');
    let photoUrl = document.getElementById('ce-photo-url').value.trim() || null;

    const submitBtn = document.getElementById('ce-submit-btn');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      if (photoFileInput?.files?.[0]) {
        const file = photoFileInput.files[0];
        if (file.size > 2 * 1024 * 1024) throw new Error('Photo must be less than 2MB');
        const up = await uploadFileToStorage('events', file);
        photoUrl = up.fileUrl;
      }

      const payload = {
        full_name: fullName,
        portfolio,
        rank_order: rankOrder,
        linkedin_url: linkedinUrl,
        photo_url: photoUrl,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      const { apiAdmin, logAdminAction } = getAdminHelpers();
      if (ceId) {
        await apiAdmin.update('executives', ceId, payload);
        if (logAdminAction) await logAdminAction('UPDATE', 'executive', ceId, { fullName, portfolio });
        Swal.fire('Updated', 'Executive updated on homepage!', 'success');
      } else {
        await apiAdmin.create('executives', payload);
        if (logAdminAction) await logAdminAction('CREATE', 'executive', null, { fullName, portfolio });
        Swal.fire('Added', 'Executive added to homepage!', 'success');
      }

      window.bootstrap?.Modal.getInstance(document.getElementById('addCurrentExecutiveModal'))?.hide();
      window.resetCurrentExecutiveForm();
      await loadHomepageCms();
    } catch (err) {
      console.error('[saveCurrentExecutive] Error:', err);
      Swal.fire('Error', err.message || 'Failed to save executive', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  });

  document.getElementById('siteSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const session = await checkAuth();
    if (!session) return;

    const btn = document.getElementById('cms-save-settings-btn');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      const bullets = [
        document.getElementById('cms-about-bullet-1').value.trim(),
        document.getElementById('cms-about-bullet-2').value.trim(),
        document.getElementById('cms-about-bullet-3').value.trim()
      ].filter(Boolean);

      const contacts = Array.from(document.querySelectorAll('#cms-inquiry-contacts-list .cms-contact-row'))
        .map(row => ({
          label: row.querySelector('.cms-contact-label')?.value.trim() || '',
          url: row.querySelector('.cms-contact-url')?.value.trim() || ''
        }))
        .filter(c => c.label && c.url);

      const payload = {
        hero_title_prefix: document.getElementById('cms-hero-prefix').value.trim(),
        hero_title_highlight: document.getElementById('cms-hero-highlight').value.trim(),
        hero_subtitle: document.getElementById('cms-hero-subtitle').value.trim(),
        about_heading: document.getElementById('cms-about-heading').value.trim(),
        about_intro: document.getElementById('cms-about-intro').value.trim(),
        about_bullets: bullets,
        exec_session: document.getElementById('cms-exec-session').value.trim(),
        exec_subtitle: document.getElementById('cms-exec-subtitle').value.trim(),
        bank_name: document.getElementById('cms-bank-name').value.trim(),
        bank_account_number: document.getElementById('cms-account-number').value.trim(),
        bank_account_name: document.getElementById('cms-account-name').value.trim(),
        dues_amount: document.getElementById('cms-dues-amount').value.trim(),
        payment_note: document.getElementById('cms-payment-note').value.trim(),
        payment_reference_format: document.getElementById('cms-payment-ref').value.trim(),
        contact_email: document.getElementById('cms-contact-email').value.trim(),
        inquiry_contacts: contacts
      };

      const res = await api.siteContent.updateSettings(payload);
      if (!res?.success) throw new Error(res?.error || res?.message || 'Failed to update settings');

      const { logAdminAction } = getAdminHelpers();
      if (logAdminAction) await logAdminAction('UPDATE', 'site_settings', '1', { exec_session: payload.exec_session });

      Swal.fire('Saved!', 'Homepage copy, dues & payment info updated live.', 'success');
      await loadHomepageCms();
    } catch (err) {
      console.error('[saveSiteSettings] Error:', err);
      Swal.fire('Error', err.message || 'Failed to save settings', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
});

window.loadHomepageCms = loadHomepageCms;
