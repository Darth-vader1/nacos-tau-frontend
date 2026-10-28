// frontend/assets/js/tracker.js
// Client-side Resource Activity Tracker for NACOS Platform
(function () {
  'use strict';

  function getApiUrl() {
    const isLocal = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';
    return (window.__CONFIG && window.__CONFIG.apiUrl) ||
      window.API_URL ||
      (isLocal ? 'http://localhost:5000/api' : 'https://naco-tau-backend.vercel.app/api');
  }

  /**
   * Tracks an interaction (view, download, save) with any academic resource,
   * past question, timetable, or career path.
   *
   * @param {Object} options
   * @param {string} options.resource_type - 'past_question' | 'academic_resource' | 'timetable' | 'career_path'
   * @param {string} [options.resource_id]
   * @param {string} options.resource_title
   * @param {string} [options.course_code]
   * @param {string} [options.action='view'] - 'view' | 'download' | 'save'
   */
  async function trackResourceActivity(options) {
    if (!options || !options.resource_type || !options.resource_title) return;

    try {
      const payload = {
        resource_type: options.resource_type,
        resource_id: options.resource_id || null,
        resource_title: options.resource_title,
        course_code: options.course_code || null,
        action: options.action || 'view'
      };

      // Retrieve user JWT token if logged in with Supabase
      let accessToken = null;
      if (window.supabase && typeof window.supabase.auth?.getSession === 'function') {
        const { data: { session } } = await window.supabase.auth.getSession().catch(() => ({ data: {} }));
        accessToken = session?.access_token || null;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/analytics/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        keepalive: true // ensures network request finishes even during navigation/download
      }).catch(err => console.debug('[Analytics] track dispatch silent notice:', err));

    } catch (e) {
      console.debug('[Analytics] Tracker error:', e);
    }
  }

  // Expose globally
  window.trackResourceActivity = trackResourceActivity;

  // Listen for elements with data-track attributes
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-track-resource]');
    if (!el) return;

    const resourceType = el.getAttribute('data-track-resource');
    const resourceTitle = el.getAttribute('data-track-title') || el.innerText || 'Resource';
    const resourceId = el.getAttribute('data-track-id') || null;
    const courseCode = el.getAttribute('data-track-course') || null;
    const action = el.getAttribute('data-track-action') || 'download';

    trackResourceActivity({
      resource_type: resourceType,
      resource_title: resourceTitle,
      resource_id: resourceId,
      course_code: courseCode,
      action: action
    });
  });

})();
