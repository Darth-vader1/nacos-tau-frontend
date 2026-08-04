// profile-management.js
// Student Profile Management and Directory Functions
//
// State is intentionally shared via window.__studentState so the student-dashboard
// module script, legacy inline scripts, and this file operate on a single source
// of truth (avoids "skills added via modal = [] on save" closure shadow bugs).

const SHARED_STATE_KEY = '__studentState';

function getSharedState() {
  if (!window[SHARED_STATE_KEY]) {
    window[SHARED_STATE_KEY] = { skills: [], interests: [] };
  }
  return window[SHARED_STATE_KEY];
}

let shared = getSharedState();
Object.defineProperty(window, 'skillsList', {
  get() { return shared.skills; },
  set(v) { shared.skills = Array.isArray(v) ? v : []; }
});
Object.defineProperty(window, 'interestsList', {
  get() { return shared.interests; },
  set(v) { shared.interests = Array.isArray(v) ? v : []; }
});

// Reusable helpers (safe to call from any context)
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
window.escapeHtml = escapeHtml;

function toast({ title, text, icon = 'info', timer = 2000 }) {
  try {
    return Swal.fire({
      title,
      text,
      icon,
      timer,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  } catch {
    if (text) console.log(`[${icon}] ${title}: ${text}`);
    else console.log(`[${icon}] ${title}`);
  }
}

// ===== PROFILE COMPLETION =====

function calculateProfileCompletion(profile) {
  if (!profile || typeof profile !== 'object') return 0;
  const fields = [
    'bio', 'skills', 'interests', 'linkedin', 'github',
    'profile_picture_url', 'year_of_study', 'graduation_year', 'phone'
  ];

  let completed = 0;
  for (const field of fields) {
    const raw = profile[field];
    if (Array.isArray(raw)) {
      if (raw.length > 0) completed += 1;
      continue;
    }
    if (typeof raw === 'number') {
      if (raw > 0) completed += 1;
      continue;
    }
    if (raw === null || raw === undefined) continue;
    const str = String(raw).trim();
    if (str !== '' && str !== '0') completed += 1;
  }
  return Math.round((completed / fields.length) * 100);
}

function updateProfileCompletion(studentData) {
  if (!studentData) return;
  let completion;
  try {
    completion = calculateProfileCompletion(studentData);
  } catch (e) {
    console.warn('calculateProfileCompletion failed:', e);
    completion = 0;
  }
  const bar = document.getElementById('profileCompletionBar');
  const text = document.getElementById('profileCompletionText');
  if (!bar || !text) return;

  bar.style.width = completion + '%';
  bar.setAttribute('aria-valuenow', String(completion));
  const tier = completion < 40 ? 'low' : completion < 70 ? 'mid' : 'high';
  const icon = completion < 40 ? '⚠️ ' : completion < 70 ? 'ℹ️ ' : '✅ ';
  text.textContent = `${icon}${completion}% Complete (${tier})`;

  bar.className = 'progress-bar';
  if (completion < 40) bar.classList.add('bg-danger');
  else if (completion < 70) bar.classList.add('bg-warning');
  else bar.classList.add('bg-success');
}

// ===== PROFILE FORM FUNCTIONS =====

function loadProfileIntoForm(studentData) {
  if (!studentData) return;
  shared = getSharedState();

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = (v === null || v === undefined) ? '' : v;
  };
  setVal('profilePhone', studentData.phone);
  setVal('profileBio', studentData.bio);
  setVal('profileLinkedin', studentData.linkedin);
  setVal('profileGithub', studentData.github);
  setVal('profileTwitter', studentData.twitter);
  setVal('profileInstagram', studentData.instagram);
  setVal('profileSnapchat', studentData.snapchat);
  setVal('profilePortfolio', studentData.portfolio_url);
  setVal('profileYearOfStudy', studentData.year_of_study);
  setVal('profileGraduationYear', studentData.graduation_year);
  setVal('profileVisibility', studentData.visibility || 'students-only');

  const bioCount = document.getElementById('bioCharCount');
  if (bioCount) bioCount.textContent = String((studentData.bio || '').length);

  const privacySettings =
    studentData.privacy_settings && typeof studentData.privacy_settings === 'object'
      ? studentData.privacy_settings
      : {};
  const setCheck = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!v;
  };
  setCheck('showEmail', privacySettings.show_email);
  setCheck('showPhone', privacySettings.show_phone);
  setCheck('showMatric', privacySettings.show_matric);

  shared.skills = Array.isArray(studentData.skills) ? studentData.skills.slice() : [];
  renderTags('skillsTags', shared.skills, 'skill');
  shared.interests = Array.isArray(studentData.interests) ? studentData.interests.slice() : [];
  renderTags('interestsTags', shared.interests, 'interest');
}

function renderTags(containerId, tags, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const safeTags = Array.isArray(tags) ? tags : [];
  container.innerHTML = safeTags.map((tag, index) => `
    <span class="tag-item ${type === 'interest' ? 'interest-tag' : ''}" role="listitem">
      ${escapeHtml(tag)}
      <span class="tag-remove" role="button" tabindex="0" aria-label="Remove ${escapeHtml(type)} tag ${escapeHtml(tag)}" data-tag-type="${type}" data-tag-index="${index}">&times;</span>
    </span>
  `).join('');
}

// ===== TAG MANAGEMENT =====

function addSkillOrInterest(type, rawValue) {
  shared = getSharedState();
  const value = String(rawValue || '').trim();
  if (!value) return false;
  if (value.length > 50) {
    toast({ title: `${type[0].toUpperCase() + type.slice(1)} Too Long`, text: 'Max 50 characters allowed', icon: 'warning' });
    return false;
  }
  const list = type === 'skill' ? shared.skills : shared.interests;
  const max = type === 'skill' ? 20 : 10;
  if (list.length >= max) {
    toast({ title: 'Maximum Reached', text: `Max ${max} ${type}s allowed`, icon: 'warning' });
    return false;
  }
  if (list.includes(value)) {
    toast({ title: 'Already Added', text: `That ${type} is already in your list`, icon: 'warning' });
    return false;
  }
  list.push(value);
  renderTags(type === 'skill' ? 'skillsTags' : 'interestsTags', list, type);
  return true;
}

window.handleSkillKeypress = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const input = document.getElementById('skillsInput');
    if (!input) return;
    if (addSkillOrInterest('skill', input.value)) input.value = '';
  }
};

window.handleInterestKeypress = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const input = document.getElementById('interestsInput');
    if (!input) return;
    if (addSkillOrInterest('interest', input.value)) input.value = '';
  }
};

window.removeTag = function (type, index) {
  shared = getSharedState();
  const list = type === 'skill' ? shared.skills : shared.interests;
  if (!Array.isArray(list) || index < 0 || index >= list.length) return;
  list.splice(index, 1);
  renderTags(type === 'skill' ? 'skillsTags' : 'interestsTags', list, type);
};

// Delegate tag-remove clicks + keyboard Enter/Space for accessibility
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-tag-type][data-tag-index]');
  if (!target) return;
  e.preventDefault();
  window.removeTag(target.getAttribute('data-tag-type'), Number(target.getAttribute('data-tag-index')));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const target = e.target.closest('[data-tag-type][data-tag-index]');
  if (!target) return;
  e.preventDefault();
  window.removeTag(target.getAttribute('data-tag-type'), Number(target.getAttribute('data-tag-index')));
});

// ===== SESSION / TOKEN HELPERS =====

async function requireAccessToken(showErrorFn) {
  const supabase = window.supabase;
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data || !data.session) {
    if (typeof showErrorFn === 'function') showErrorFn('Your session expired. Please log in again.');
    setTimeout(() => { window.location.href = 'student-login.html'; }, 1200);
    return null;
  }
  return data.session.access_token;
}

// ===== PROFILE FORM SUBMISSION =====

function setupProfileForm(supabase, showSuccess, showError, loadStudentData) {
  // Bio character counter
  const bioTextarea = document.getElementById('profileBio');
  if (bioTextarea) {
    const update = () => {
      const counter = document.getElementById('bioCharCount');
      if (counter) counter.textContent = String(bioTextarea.value.length);
    };
    bioTextarea.addEventListener('input', update);
    update();
  }

  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm && !editProfileForm.dataset.setupDone) {
    editProfileForm.dataset.setupDone = '1';
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      shared = getSharedState();
      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
      }
      try {
        const get = (id) => {
          const el = document.getElementById(id);
          return el ? el.value : '';
        };
        const socialFields = ['linkedin', 'github', 'twitter', 'instagram', 'portfolio_url'];
        const normalizeUrl = (v) => {
          const s = String(v || '').trim();
          if (!s) return null;
          try {
            const u = new URL(s);
            if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
            return u.toString();
          } catch {
            return null;
          }
        };

        const formData = {
          phone: get('profilePhone').trim() || null,
          bio: get('profileBio').trim(),
          skills: shared.skills.slice(),
          interests: shared.interests.slice(),
          linkedin: normalizeUrl(get('profileLinkedin')),
          github: normalizeUrl(get('profileGithub')),
          twitter: normalizeUrl(get('profileTwitter')),
          instagram: normalizeUrl(get('profileInstagram')),
          snapchat: get('profileSnapchat').trim() || null,
          portfolio_url: normalizeUrl(get('profilePortfolio')),
          year_of_study: Number.parseInt(get('profileYearOfStudy'), 10) || null,
          graduation_year: Number.parseInt(get('profileGraduationYear'), 10) || null,
          visibility: document.getElementById('profileVisibility')?.value || 'students-only',
          privacy_settings: {
            show_email: !!document.getElementById('showEmail')?.checked,
            show_phone: !!document.getElementById('showPhone')?.checked,
            show_matric: !!document.getElementById('showMatric')?.checked
          }
        };

        const API_BASE_URL = window.__CONFIG?.apiUrl || window.API_URL || 'http://localhost:5000/api';
        const token = await requireAccessToken(showError);
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/students/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          if (payload && payload.fields && typeof payload.fields === 'object') {
            const fieldErrors = Object.entries(payload.fields)
              .map(([field, messages]) => `${field}: ${[].concat(messages).join(', ')}`)
              .join('\n');
            throw new Error(`Validation failed:\n${fieldErrors}`);
          }
          throw new Error(payload.message || payload.error || 'Failed to update profile');
        }

        if (typeof loadStudentData === 'function') await loadStudentData();
        updateProfileCompletion(window.studentData);
        showSuccess('Profile updated successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        if (modal) modal.hide();
      } catch (error) {
        console.error('Profile update error:', error);
        showError(error && error.message ? error.message : 'Failed to update profile');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml || '<i class="bi bi-check-circle"></i> Save Profile';
        }
      }
    });
  }

  const editProfileModal = document.getElementById('editProfileModal');
  if (editProfileModal && !editProfileModal.dataset.setupDone) {
    editProfileModal.dataset.setupDone = '1';
    editProfileModal.addEventListener('show.bs.modal', () => loadProfileIntoForm(window.studentData));
  }
}

// Export functions
window.setupProfileForm = setupProfileForm;
window.updateProfileCompletion = updateProfileCompletion;
window.loadProfileIntoForm = loadProfileIntoForm;
window.requireAccessToken = requireAccessToken;
window.calculateProfileCompletion = calculateProfileCompletion;
window.addSkillOrInterest = addSkillOrInterest;
