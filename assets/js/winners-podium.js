// frontend/assets/js/winners-podium.js
// Reusable 2-1-3 Sports Podium renderer for Game Night & Event winners.

(function () {
  function esc(v) {
    if (v === null || v === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(v);
    return d.innerHTML;
  }

  function injectPodiumStyles() {
    if (document.getElementById('nacos-podium-styles')) return;
    const style = document.createElement('style');
    style.id = 'nacos-podium-styles';
    style.textContent = `
      .nacos-podium-arena {
        position: relative;
        background: radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.22) 0%, rgba(15, 23, 42, 0.96) 55%, #090d16 100%);
        border-radius: 18px;
        padding: 22px 16px 18px;
        color: #f8fafc;
        overflow: hidden;
        border: 1px solid rgba(251, 191, 36, 0.28);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
      }
      .nacos-podium-spotlights {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse 40% 55% at 50% 0%, rgba(255, 255, 255, 0.14), transparent 70%),
          radial-gradient(ellipse 25% 45% at 18% 0%, rgba(56, 189, 248, 0.12), transparent 70%),
          radial-gradient(ellipse 25% 45% at 82% 0%, rgba(56, 189, 248, 0.12), transparent 70%);
      }
      .nacos-podium-header {
        position: relative;
        z-index: 1;
        text-align: center;
        margin-bottom: 14px;
      }
      .nacos-podium-header h5 {
        margin: 0;
        font-weight: 800;
        letter-spacing: 0.4px;
        color: #fde68a;
        font-size: 1.05rem;
      }
      .nacos-podium-tabs {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;
      }
      .nacos-podium-tab {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 12px;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .nacos-podium-tab.active,
      .nacos-podium-tab:hover {
        background: #fbbf24;
        color: #0f172a;
        border-color: #fbbf24;
      }
      .nacos-podium-stage {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 10px;
        padding-top: 8px;
      }
      .nacos-podium-col {
        flex: 1 1 0;
        max-width: 190px;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .nacos-podium-col.slot-2 { order: 1; }
      .nacos-podium-col.slot-1 { order: 2; }
      .nacos-podium-col.slot-3 { order: 3; }

      .nacos-podium-winner {
        margin-bottom: 8px;
        width: 100%;
        padding: 0 4px;
      }
      .nacos-podium-trophy {
        font-size: 1.65rem;
        line-height: 1;
        margin-bottom: 4px;
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
      }
      .slot-1 .nacos-podium-trophy { font-size: 2.1rem; color: #fbbf24; }
      .slot-2 .nacos-podium-trophy { color: #cbd5e1; }
      .slot-3 .nacos-podium-trophy { color: #f59e0b; }

      .nacos-podium-name {
        font-weight: 700;
        font-size: 0.88rem;
        color: #ffffff;
        word-break: break-word;
        line-height: 1.25;
      }
      .slot-1 .nacos-podium-name { font-size: 0.96rem; color: #fef3c7; }
      .nacos-podium-tag {
        font-size: 0.74rem;
        color: #94a3b8;
        margin-top: 2px;
        word-break: break-word;
      }
      .nacos-podium-prize {
        display: inline-block;
        margin-top: 4px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        background: rgba(21, 122, 9, 0.35);
        color: #86efac;
        border: 1px solid rgba(134, 239, 172, 0.35);
      }
      .nacos-podium-block {
        width: 100%;
        border-radius: 10px 10px 4px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.35), 0 8px 18px rgba(0, 0, 0, 0.35);
        position: relative;
      }
      .nacos-podium-num {
        font-size: 2rem;
        line-height: 1;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      }
      .nacos-podium-pos-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.9;
        margin-top: 2px;
      }
      .slot-1 .nacos-podium-block {
        height: 118px;
        background: linear-gradient(180deg, #f59e0b 0%, #b45309 100%);
        color: #fffbeb;
      }
      .slot-2 .nacos-podium-block {
        height: 86px;
        background: linear-gradient(180deg, #94a3b8 0%, #475569 100%);
        color: #f8fafc;
      }
      .slot-3 .nacos-podium-block {
        height: 66px;
        background: linear-gradient(180deg, #d97706 0%, #78350f 100%);
        color: #fef3c7;
      }
      .nacos-podium-deck {
        position: relative;
        z-index: 1;
        height: 8px;
        background: linear-gradient(90deg, #334155, #64748b, #334155);
        border-radius: 999px;
        margin-top: 0;
      }
      .nacos-podium-extras {
        position: relative;
        z-index: 1;
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }
      .nacos-podium-extra-pill {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 0.75rem;
        color: #e2e8f0;
      }
      @media (max-width: 480px) {
        .nacos-podium-arena { padding: 16px 10px 14px; }
        .nacos-podium-stage { gap: 6px; }
        .nacos-podium-name { font-size: 0.78rem; }
        .slot-1 .nacos-podium-name { font-size: 0.84rem; }
        .nacos-podium-num { font-size: 1.55rem; }
        .slot-1 .nacos-podium-block { height: 98px; }
        .slot-2 .nacos-podium-block { height: 74px; }
        .slot-3 .nacos-podium-block { height: 56px; }
      }
    `;
    document.head.appendChild(style);
  }

  function classifySlot(placement) {
    const p = String(placement || '').toLowerCase().trim();
    if (/^(1|1st|first)\b|champion|gold|winner/.test(p)) return 1;
    if (/^(2|2nd|second)\b|runner[- ]?up|silver/.test(p)) return 2;
    if (/^(3|3rd|third)\b|bronze/.test(p)) return 3;
    return 0;
  }

  function renderGroupStage(list) {
    const slots = { 1: null, 2: null, 3: null };
    const extras = [];

    list.forEach(w => {
      const slot = classifySlot(w.placement);
      if (slot && !slots[slot]) {
        slots[slot] = w;
      } else {
        extras.push(w);
      }
    });

    // If none matched 1/2/3 keywords, put first 3 onto 1,2,3
    if (!slots[1] && !slots[2] && !slots[3] && extras.length > 0) {
      if (extras[0]) slots[1] = extras.shift();
      if (extras[0]) slots[2] = extras.shift();
      if (extras[0]) slots[3] = extras.shift();
    }

    const order = [2, 1, 3];
    const stageCols = order
      .filter(num => Boolean(slots[num]))
      .map(num => {
        const w = slots[num];
        const iconClass = num === 1 ? 'bi-trophy-fill' : 'bi-award-fill';
        return `
          <div class="nacos-podium-col slot-${num}">
            <div class="nacos-podium-winner">
              <div class="nacos-podium-trophy"><i class="bi ${iconClass}"></i></div>
              <div class="nacos-podium-name">${esc(w.winner_name)}</div>
              ${w.in_game_username ? `<div class="nacos-podium-tag">@${esc(w.in_game_username)}</div>` : ''}
              ${w.prize ? `<span class="nacos-podium-prize">${esc(w.prize)}</span>` : ''}
            </div>
            <div class="nacos-podium-block">
              <span class="nacos-podium-num">${num}</span>
              <span class="nacos-podium-pos-label">${esc(w.placement || `${num}`)}</span>
            </div>
          </div>
        `;
      }).join('');

    const extrasHtml = extras.length
      ? `<div class="nacos-podium-extras">${extras.map(w => `
          <span class="nacos-podium-extra-pill">
            <strong class="text-warning">${esc(w.placement)}:</strong>
            ${esc(w.winner_name)}${w.in_game_username ? ` (@${esc(w.in_game_username)})` : ''}${w.prize ? ` — ${esc(w.prize)}` : ''}
          </span>
        `).join('')}</div>`
      : '';

    return `
      <div class="nacos-podium-stage">${stageCols}</div>
      <div class="nacos-podium-deck"></div>
      ${extrasHtml}
    `;
  }

  window.buildWinnersPodiumHtml = function (winners, { title = 'Official Champions Podium', uid = '' } = {}) {
    if (!Array.isArray(winners) || winners.length === 0) return '';
    injectPodiumStyles();

    const groups = new Map();
    winners.forEach(w => {
      const key = w.game_name || 'Overall';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(w);
    });

    const keys = Array.from(groups.keys());
    const idPrefix = uid || ('podium-' + Math.random().toString(36).slice(2, 8));

    const tabsHtml = keys.length > 1
      ? `<div class="nacos-podium-tabs" data-podium-tabs="${esc(idPrefix)}">
          ${keys.map((k, idx) => `
            <button type="button" class="nacos-podium-tab ${idx === 0 ? 'active' : ''}" data-podium-target="${esc(idPrefix)}-${idx}">
              ${esc(k)}
            </button>
          `).join('')}
        </div>`
      : (keys[0] !== 'Overall'
          ? `<div class="text-center mb-2 position-relative" style="z-index:1;"><span class="badge bg-warning text-dark">${esc(keys[0])}</span></div>`
          : '');

    const panelsHtml = keys.map((k, idx) => `
      <div class="nacos-podium-panel" id="${esc(idPrefix)}-${idx}" style="display: ${idx === 0 ? 'block' : 'none'};">
        ${renderGroupStage(groups.get(k))}
      </div>
    `).join('');

    return `
      <div class="nacos-podium-arena mb-3" data-podium-root="${esc(idPrefix)}">
        <div class="nacos-podium-spotlights"></div>
        <div class="nacos-podium-header">
          <h5><i class="bi bi-trophy-fill text-warning me-2"></i>${esc(title)}</h5>
        </div>
        ${tabsHtml}
        ${panelsHtml}
      </div>
    `;
  };

  // Delegate tab clicks globally so dynamically injected modals work automatically
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nacos-podium-tab[data-podium-target]');
    if (!btn) return;
    const targetId = btn.getAttribute('data-podium-target');
    const root = btn.closest('.nacos-podium-arena');
    if (!root || !targetId) return;

    root.querySelectorAll('.nacos-podium-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    root.querySelectorAll('.nacos-podium-panel').forEach(p => {
      p.style.display = p.id === targetId ? 'block' : 'none';
    });
  });
})();
