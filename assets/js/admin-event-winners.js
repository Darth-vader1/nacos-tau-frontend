// frontend/assets/js/admin-event-winners.js
// Admin modal controller for managing & announcing Game Night / Event winners.

import { supabase, checkAuth } from './supabase-config.js';
import { api } from './api-config.js?v=2.4';

let activeEventId = null;
let activeEventTitle = '';
let cachedGames = [];
let cachedPlayers = [];
let cachedWinners = [];

function esc(v) {
  if (v === null || v === undefined) return '';
  const d = document.createElement('div');
  d.textContent = String(v);
  return d.innerHTML;
}

function getApiRoot() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return (window.__CONFIG?.apiUrl || (isLocal ? 'http://localhost:5000/api' : 'https://naco-tau-backend.vercel.app/api')).replace(/\/$/, '');
}

async function fetchAuthJson(path) {
  const { data: { session } } = await supabase.auth.getSession();
  const resp = await fetch(`${getApiRoot()}${path}`, {
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  });
  return resp.json();
}

function renderWinnersList() {
  const tbody = document.getElementById('ew-winners-tbody');
  const announceBtn = document.getElementById('ew-announce-btn');
  if (!tbody) return;

  if (!cachedWinners.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No winners added yet. Add winners above, then click Announce!</td></tr>';
    if (announceBtn) announceBtn.disabled = true;
    return;
  }

  if (announceBtn) announceBtn.disabled = false;
  tbody.innerHTML = cachedWinners.map(w => {
    const gameLabel = w.game_name ? `<span class="badge bg-success-subtle text-success">${esc(w.game_name)}</span>` : '<span class="badge bg-light text-dark border">Overall</span>';
    const tag = w.in_game_username ? `<div class="small text-muted">@${esc(w.in_game_username)}</div>` : '';
    const statusBadge = w.announced_at
      ? '<span class="badge bg-success">Announced</span>'
      : '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning">Draft</span>';

    return `
      <tr>
        <td>${gameLabel}</td>
        <td><strong>${esc(w.placement)}</strong></td>
        <td>
          <div class="fw-semibold">${esc(w.winner_name)}</div>
          ${tag}
          ${w.winner_email ? `<div class="small text-muted">${esc(w.winner_email)}</div>` : ''}
        </td>
        <td>
          ${w.prize ? `<span class="badge bg-warning text-dark">${esc(w.prize)}</span>` : '<span class="text-muted">—</span>'}
          <div class="mt-1">${statusBadge}</div>
        </td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteEventWinner('${esc(w.id)}')" title="Remove">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function refreshWinnersData() {
  if (!activeEventId) return;
  const warningEl = document.getElementById('ew-migration-warning');
  const res = await api.eventWinners.list(activeEventId, { includeDrafts: true });
  if (warningEl) warningEl.style.display = res?.data?.tableMissing ? 'block' : 'none';
  cachedWinners = Array.isArray(res?.data?.winners) ? res.data.winners : [];
  renderWinnersList();
}

function playerMatchesGame(p, gameId) {
  if (!gameId) return true;
  if (p.item_id && String(p.item_id) === String(gameId)) return true;
  if (Array.isArray(p.order_items) && p.order_items.some(x => String(x.item_id) === String(gameId))) return true;
  if (Array.isArray(p.entry_details) && p.entry_details.some(x => String(x.item_id) === String(gameId))) return true;
  return false;
}

function getPlayerDisplay(p, gameId = '') {
  const name = p.students?.name || p.guest_name || p.student_name || p.name || p.students?.email || p.guest_email || 'Participant';
  const email = p.students?.email || p.guest_email || p.email || '';
  const entries = Array.isArray(p.entry_details) ? p.entry_details : (Array.isArray(p.order_items) ? p.order_items : []);
  const matchingEntry = gameId ? entries.find(x => String(x.item_id) === String(gameId) && x.username) : null;
  const tags = matchingEntry?.username
    ? matchingEntry.username
    : entries.map(x => x.username).filter(Boolean).join(', ');
  return { name, email, tags };
}

function renderPlayerSelect(gameId = '') {
  const playerSel = document.getElementById('ew-player-select');
  if (!playerSel) return;

  const filtered = cachedPlayers.filter(p => playerMatchesGame(p, gameId));
  const emptyText = gameId && filtered.length === 0
    ? '-- No registered players found for this game (enter manually) --'
    : `-- Enter manually or pick from ${filtered.length} player(s) --`;

  playerSel.innerHTML = `<option value="">${esc(emptyText)}</option>` +
    filtered.map(p => {
      const { name, email, tags } = getPlayerDisplay(p, gameId);
      const label = `${name}${tags ? ` (@${tags})` : ''}${email ? ` — ${email}` : ''}`;
      return `<option value="${esc(p.id)}">${esc(label)}</option>`;
    }).join('');
}

window.manageEventWinners = async function(eventId) {
  const session = await checkAuth();
  if (!session) return;

  activeEventId = eventId;
  const ev = (window.currentEventsList || []).find(e => String(e.id) === String(eventId));
  activeEventTitle = ev?.title || 'Event';

  const titleEl = document.getElementById('ew-modal-title');
  if (titleEl) titleEl.innerHTML = `<i class="bi bi-trophy-fill text-warning me-2"></i>Winners — ${esc(activeEventTitle)}`;

  document.getElementById('ew-add-form')?.reset();
  const modalEl = document.getElementById('eventWinnersModal');
  if (modalEl && window.bootstrap) {
    window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  try {
    const [itemsRes, regsRes] = await Promise.all([
      fetchAuthJson(`/events/${encodeURIComponent(eventId)}/items`),
      fetchAuthJson(`/events/${encodeURIComponent(eventId)}/registrations`)
    ]);

    cachedGames = Array.isArray(itemsRes?.data?.items) ? itemsRes.data.items : (Array.isArray(itemsRes?.data) ? itemsRes.data : []);
    cachedPlayers = Array.isArray(regsRes?.data?.registrations) ? regsRes.data.registrations : (Array.isArray(regsRes?.data) ? regsRes.data : []);

    // Populate game dropdown
    const gameSel = document.getElementById('ew-game-select');
    if (gameSel) {
      gameSel.innerHTML = '<option value="">Overall Event Winner</option>' +
        cachedGames.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
    }

    // Populate player quick-pick dropdown (filtered by selected game)
    renderPlayerSelect(gameSel ? gameSel.value : '');

    await refreshWinnersData();
  } catch (err) {
    console.error('[manageEventWinners] Load error:', err);
    Swal.fire('Error', 'Failed to load event details: ' + (err.message || err), 'error');
  }
};

window.deleteEventWinner = async function(winnerId) {
  if (!activeEventId || !winnerId) return;
  try {
    const res = await api.eventWinners.remove(activeEventId, winnerId);
    if (!res?.success) throw new Error(res?.error || 'Failed to remove winner');
    await refreshWinnersData();
  } catch (err) {
    Swal.fire('Error', err.message || 'Failed to remove winner', 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Re-filter registered players when Game / Category changes
  document.getElementById('ew-game-select')?.addEventListener('change', (e) => {
    renderPlayerSelect(e.target.value);
  });

  // Auto-fill winner fields when picking a registered player
  document.getElementById('ew-player-select')?.addEventListener('change', (e) => {
    const regId = e.target.value;
    if (!regId) return;
    const p = cachedPlayers.find(x => String(x.id) === String(regId));
    if (!p) return;

    const gameId = document.getElementById('ew-game-select')?.value || '';
    const { name, email, tags } = getPlayerDisplay(p, gameId);

    const nameInput = document.getElementById('ew-winner-name');
    const emailInput = document.getElementById('ew-winner-email');
    const tagInput = document.getElementById('ew-gamertag');

    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
    if (tagInput) tagInput.value = tags || '';
  });

  document.getElementById('ew-add-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeEventId) return;

    const btn = document.getElementById('ew-add-btn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Adding...';

    try {
      const payload = {
        item_id: document.getElementById('ew-game-select').value || null,
        registration_id: document.getElementById('ew-player-select').value || null,
        winner_name: document.getElementById('ew-winner-name').value.trim(),
        in_game_username: document.getElementById('ew-gamertag').value.trim() || null,
        winner_email: document.getElementById('ew-winner-email').value.trim() || null,
        placement: document.getElementById('ew-placement').value.trim() || '1st Place',
        prize: document.getElementById('ew-prize').value.trim() || null,
        note: document.getElementById('ew-note').value.trim() || null
      };

      const res = await api.eventWinners.add(activeEventId, payload);
      if (!res?.success) throw new Error(res?.error || res?.message || 'Failed to add winner');

      e.target.reset();
      await refreshWinnersData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Could not add winner', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  document.getElementById('ew-announce-btn')?.addEventListener('click', async () => {
    if (!activeEventId || !cachedWinners.length) return;

    const notifyWinners = document.getElementById('ew-notify-winners')?.checked !== false;
    const notifyScope = document.getElementById('ew-notify-scope')?.value || 'participants';

    const confirm = await Swal.fire({
      title: `Announce ${cachedWinners.length} Winner(s)?`,
      text: `This will publish the winners publicly on the Events & Archive pages${notifyScope !== 'none' || notifyWinners ? ' and send notification emails.' : '.'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#157a09',
      confirmButtonText: 'Yes, Announce Winners!'
    });
    if (!confirm.isConfirmed) return;

    const btn = document.getElementById('ew-announce-btn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Announcing...';

    try {
      const res = await api.eventWinners.announce(activeEventId, {
        notify_winners: notifyWinners,
        notify_scope: notifyScope
      });
      if (!res?.success) throw new Error(res?.error || res?.message || 'Failed to announce winners');

      const d = res.data || {};
      await refreshWinnersData();
      Swal.fire(
        'Winners Announced!',
        `Published ${d.winners?.length || cachedWinners.length} winner(s). Congrats emails sent: ${d.congratsSent || 0}. Broadcast recipients: ${d.broadcastCount || 0}.`,
        'success'
      );
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to announce winners', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });
});
