// PWA Installation & Service Worker Registration Script
(function initPWA() {
  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('⚠️ Service Worker registration failed:', err);
        });
    });
  }

  // 2. Add to Home Screen Prompt Handling
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile Chrome/Android
    e.preventDefault();
    deferredPrompt = e;

    // Show custom Install Banner / Button if not previously dismissed
    if (!localStorage.getItem('nacos_pwa_dismissed')) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('🎉 NACOS TAU App installed successfully!');
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
        console.log('[PWA] User choice:', outcome);
        deferredPrompt = null;
        hideInstallBanner();
      }
    });

    document.getElementById('pwaCloseBtn').addEventListener('click', () => {
      hideInstallBanner();
      // Dismiss for 7 days
      localStorage.setItem('nacos_pwa_dismissed', Date.now().toString());
    });
  }

  function hideInstallBanner() {
    const el = document.getElementById('pwaInstallBanner');
    if (el) el.remove();
  }
})();
