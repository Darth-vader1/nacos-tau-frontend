/**
* Template Name: QuickStart
* Template URL: https://bootstrapmade.com/quickstart-bootstrap-startup-website-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  var ready = function(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  /**
   * Preloader — remove on load + 2.5s safety fallback (run regardless of load event)
   */
  (function handlePreloader() {
    var preloader = document.querySelector('#preloader');
    var removed = false;
    var removePreloader = function() {
      if (removed || !preloader) return;
      removed = true;
      try { preloader.remove(); } catch (e) {
        preloader.style.display = 'none';
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';
      }
    };
    window.addEventListener('load', removePreloader);
    setTimeout(removePreloader, 2500);
  })();

  /**
   * Fallback AOS init — ensure [data-aos] elements become visible even if init is delayed
   */
  (function ensureAosVisible() {
    var fallback = function() {
      try {
        var els = document.querySelectorAll('[data-aos]');
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          el.style.opacity = '';
          el.style.transform = '';
          el.style.transition = '';
          el.removeAttribute('data-aos-id');
        }
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('load', function() { setTimeout(fallback, 800); });
    setTimeout(fallback, 4000);
  })();

  /**
   * Student auth-aware button visibility (safe: elements may not exist on all pages)
   */
  ready(async function() {
    var homeBtn = document.getElementById('home-btn');
    var homeBtn2 = document.getElementById('home-btn2');
    var signinBtn = document.getElementById('signin-btn');
    var signinBtn2 = document.getElementById('signin-btn2');
    var rsvpLink = document.getElementById('rsvp-link');

    try {
      var sb = window.supabase;
      if (sb) {
        var result = await sb.auth.getUser();
        var hasUser = result && result.data && result.data.user && !result.error;
        if (hasUser) {
          if (homeBtn) homeBtn.style.display = 'flex';
          if (homeBtn2) homeBtn2.style.display = 'flex';
          if (signinBtn) signinBtn.style.display = 'none';
          if (signinBtn2) signinBtn2.style.display = 'none';
          if (rsvpLink) rsvpLink.href = 'events.html';
        } else {
          if (signinBtn) signinBtn.style.display = 'flex';
          if (signinBtn2) signinBtn2.style.display = 'flex';
          if (homeBtn) homeBtn.style.display = 'none';
          if (homeBtn2) homeBtn2.style.display = 'none';
          if (rsvpLink) rsvpLink.href = 'student-login.html';
        }
      } else {
        if (signinBtn) signinBtn.style.display = 'flex';
        if (signinBtn2) signinBtn2.style.display = 'flex';
        if (homeBtn) homeBtn.style.display = 'none';
        if (homeBtn2) homeBtn2.style.display = 'none';
        if (rsvpLink) rsvpLink.href = 'student-login.html';
      }
    } catch (err) {
      console.warn('Auth check skipped:', err && err.message ? err.message : err);
    }

    var hashParams = new URLSearchParams(window.location.hash.substring(1));
    var accessToken = hashParams.get('access_token');
    var refreshToken = hashParams.get('refresh_token');
    if (accessToken) {
      try { sessionStorage.setItem('supabaseAccessToken', accessToken); } catch (e) {}
      try { sessionStorage.setItem('supabaseRefreshToken', refreshToken); } catch (e) {}
      try { window.location.href = 'index.html'; } catch (e) {}
    }
  });

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    var selectBody = document.querySelector('body');
    var selectHeader = document.querySelector('#header');
    if (!selectHeader) return;
    if (!selectHeader.classList.contains('scroll-up-sticky') &&
        !selectHeader.classList.contains('sticky-top') &&
        !selectHeader.classList.contains('fixed-top')) return;
    if (window.scrollY > 100) selectBody.classList.add('scrolled');
    else selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled, { passive: true });
  ready(toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  var mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
  if (mobileNavToggleBtn) {
    function mobileNavToogle() {
      var body = document.querySelector('body');
      if (body) body.classList.toggle('mobile-nav-active');
      mobileNavToggleBtn.classList.toggle('bi-list');
      mobileNavToggleBtn.classList.toggle('bi-x');
    }
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

    document.querySelectorAll('#navmenu a').forEach(function(navmenu) {
      navmenu.addEventListener('click', function() {
        if (document.querySelector('.mobile-nav-active')) mobileNavToogle();
      });
    });
  }

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(function(navmenu) {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      if (this.parentNode) this.parentNode.classList.toggle('active');
      if (this.parentNode && this.parentNode.nextElementSibling) {
        this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      }
      e.stopImmediatePropagation();
    });
  });

  /**
   * Scroll top button
   */
  var scrollTop = document.querySelector('.scroll-top');
  if (scrollTop) {
    function toggleScrollTop() {
      if (window.scrollY > 100) scrollTop.classList.add('active');
      else scrollTop.classList.remove('active');
    }
    scrollTop.addEventListener('click', function(e) {
      e.preventDefault();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });

    window.addEventListener('load', toggleScrollTop);
    document.addEventListener('scroll', toggleScrollTop, { passive: true });
    ready(toggleScrollTop);
  }

  /**
   * Animation on scroll function and init (AOS)
   */
  function aosInit() {
    if (typeof AOS !== 'undefined') {
      try {
        AOS.init({
          duration: 600,
          easing: 'ease-in-out',
          once: true,
          mirror: false
        });
      } catch (e) { console.warn('AOS init failed:', e); }
    }
  }
  window.addEventListener('load', aosInit);
  ready(aosInit);

  /**
   * Initiate glightbox
   */
  if (typeof GLightbox !== 'undefined') {
    try { GLightbox({ selector: '.glightbox' }); } catch (e) { console.warn('GLightbox init failed:', e); }
  }

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach(function(faqItem) {
    faqItem.addEventListener('click', function() {
      if (faqItem.parentNode) faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll('.init-swiper').forEach(function(swiperElement) {
      var cfgEl = swiperElement.querySelector('.swiper-config');
      if (!cfgEl) return;
      try {
        var config = JSON.parse(cfgEl.innerHTML.trim());
        if (swiperElement.classList.contains('swiper-tab')) {
          if (typeof initSwiperWithCustomPagination === 'function') {
            initSwiperWithCustomPagination(swiperElement, config);
          }
        } else {
          new Swiper(swiperElement, config);
        }
      } catch (e) { console.warn('Swiper init failed:', e); }
    });
  }
  window.addEventListener('load', initSwiper);
  ready(initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function() {
    if (!window.location.hash) return;
    var section = document.querySelector(window.location.hash);
    if (!section) return;
    setTimeout(function() {
      var mt = getComputedStyle(section).scrollMarginTop;
      var mtInt = parseInt(mt, 10);
      var top = section.offsetTop - (isNaN(mtInt) ? 0 : mtInt);
      try {
        window.scrollTo({ top: top, behavior: 'smooth' });
      } catch (e) { window.scrollTo(0, top); }
    }, 150);
  });

  /**
   * Navmenu Scrollspy
   */
  var navmenulinks = document.querySelectorAll('.navmenu a');
  function navmenuScrollspy() {
    if (!navmenulinks || !navmenulinks.length) return;
    navmenulinks.forEach(function(navmenulink) {
      if (!navmenulink.hash) return;
      var section = document.querySelector(navmenulink.hash);
      if (!section) return;
      var position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(function(link) {
          link.classList.remove('active');
        });
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    });
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy, { passive: true });

})();

/* Event description logic (hide read-more on "upcoming") */
document.addEventListener('DOMContentLoaded', function() {
  try {
    var events = document.querySelectorAll('.service-item');
    events.forEach(function(ev) {
      var desc = (ev.querySelector('p em') || {}).textContent;
      var link = ev.querySelector('a.read-more');
      if (!link) return;
      if (desc && String(desc).toLowerCase().indexOf('upcoming') !== -1) {
        link.style.display = 'none';
      } else {
        link.style.display = 'block';
      }
    });
  } catch (e) { /* ignore */ }
});
