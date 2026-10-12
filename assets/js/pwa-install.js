// PWA Installation & Live Update Detection Script
(function initPWA() {
  let refreshing = false;

  // 1. Listen for Service Worker Controller Change (when new SW takes over, reload to apply)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ PWA Service Worker registered:', reg.scope);

          // If a new worker is already waiting, prompt immediately
          if (reg.waiting) {
            showUpdatePrompt(reg.waiting, 'A new version of NACOS Portal is available.');
            return;
          }

          // Listen for new worker updates found in the background
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available and waiting to activate
                showUpdatePrompt(newWorker, 'A new version of NACOS Portal is available.');
              }
            });
          });

          // Check for service worker updates periodically (every 10 minutes)
          setInterval(() => {
            reg.update().catch(() => {});
          }, 10 * 60 * 1000);
        })
        .catch((err) => {
          console.warn('⚠️ Service Worker registration failed:', err);
        });
    });
  }

  // 2. Realtime Broadcast Listener for newly published site content (Events, Timetables, Past Questions, etc.)
  function setupLiveContentUpdateListener() {
    // Only initialize if Supabase client is available on the page
    if (typeof supabase === 'undefined' || !supabase.channel) {
      setTimeout(setupLiveContentUpdateListener, 2000);
      return;
    }

    try {
      supabase
        .channel('public-site-updates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'events' },
          (payload) => {
            const title = payload.new?.title ? `"${payload.new.title}"` : 'A new event';
            showUpdatePrompt(null, `🎉 ${title} was just published!`);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'past_questions' },
          (payload) => {
            const code = payload.new?.course_code || 'Past question';
            showUpdatePrompt(null, `📚 New resource uploaded: ${code}!`);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'timetables' },
          (payload) => {
            showUpdatePrompt(null, `📅 New timetable updated!`);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Live content update channel notice:', e);
    }
  }

  // Initialize content broadcast listener
  setupLiveContentUpdateListener();

  // 3. UI: Update Available Banner / Modal Prompt
  function showUpdatePrompt(worker, messageText) {
    if (document.getElementById('nacosUpdatePrompt')) return;

    const banner = document.createElement('div');
    banner.id = 'nacosUpdatePrompt';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        background: linear-gradient(135deg, #0b4506 0%, #1b8c0c 100%);
        color: white;
        padding: 14px 20px;
        border-radius: 16px;
        box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        gap: 14px;
        max-width: 92vw;
        width: 440px;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        animation: updateSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        ">
          🔄
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; line-height: 1.2;">Update Available</div>
          <div style="font-size: 12.5px; opacity: 0.9; margin-top: 2px;">${escapeHtml(messageText || 'New updates have been published.')}</div>
        </div>
        <button id="nacosRefreshBtn" style="
          background: #ffffff;
          color: #146c0a;
          border: none;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.15s ease, background 0.15s ease;
        ">Refresh</button>
        <button id="nacosUpdateCloseBtn" style="
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 22px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        ">&times;</button>
      </div>
      <style>
        @keyframes updateSlideDown {
          from { opacity: 0; transform: translate(-50%, -24px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        #nacosRefreshBtn:hover {
          transform: scale(1.03);
          background: #f0fdf4;
        }
      </style>
    `;

    document.body.appendChild(banner);

    document.getElementById('nacosRefreshBtn').addEventListener('click', () => {
      if (worker) {
        // Post message to Service Worker to skip waiting and activate immediately
        worker.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });

    document.getElementById('nacosUpdateCloseBtn').addEventListener('click', () => {
      banner.remove();
    });
  }

  // 4. Add to Home Screen Prompt Handling
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!localStorage.getItem('nacos_pwa_dismissed')) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: #111827;
        color: white;
        padding: 12px 18px;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 92vw;
        width: 420px;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        animation: pwaSlideUp 0.3s ease-out;
      ">
        <img src="assets/img/tau_logo-removebg-preview.png" alt="NACOS Logo" style="width: 38px; height: 38px; object-fit: contain; border-radius: 8px;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; line-height: 1.2;">Install NACOS Portal</div>
          <div style="font-size: 12px; color: #9ca3af;">Add to Home Screen for fast, app-like access</div>
        </div>
        <button id="pwaInstallBtn" style="
          background: #1b8c0c;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        ">Install</button>
        <button id="pwaCloseBtn" style="
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        ">&times;</button>
      </div>
      <style>
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      </style>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideInstallBanner();
      }
    });

    document.getElementById('pwaCloseBtn').addEventListener('click', () => {
      hideInstallBanner();
      localStorage.setItem('nacos_pwa_dismissed', Date.now().toString());
    });
  }

  function hideInstallBanner() {
    const el = document.getElementById('pwaInstallBanner');
    if (el) el.remove();
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
