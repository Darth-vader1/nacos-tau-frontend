// assets/js/security.js
// Frontend Security Module - CSRF Protection & Security Utilities
// Phase 3.1: Token Refresh and Session Management

/**
 * Security Manager
 * Handles CSRF tokens, secure requests, session management, and auto-refresh
 */
class SecurityManager {
  constructor() {
    this.csrfToken = null;
    this.csrfExpiry = null;
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Session management
    this.session = null;
    this.sessionCheckInterval = null;
    this.autoRefreshEnabled = true;
    this.sessionWarningShown = false;
  }

  /**
   * Initialize security manager
   * Fetches CSRF token if enabled on backend and sets up session monitoring
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if CSRF is enabled by calling health endpoint
      const healthResponse = await fetch(`${window.API_URL || '/api'}/health`);
      const health = await healthResponse.json();

      if (health.security?.csrf) {
        console.log('🔒 CSRF protection enabled, fetching token...');
        await this.refreshCsrfToken();
      } else {
        console.log('ℹ️  CSRF protection not enabled on backend');
      }

      // Initialize session monitoring if user is logged in
      await this.initializeSessionMonitoring();

      this.isInitialized = true;
      console.log('✅ Security Manager initialized with session monitoring');
    } catch (error) {
      console.warn('⚠️  Could not initialize security manager:', error.message);
      this.isInitialized = true; // Continue anyway
    }
  }

  /**
   * Initialize session monitoring
   * Checks session status and auto-refreshes when needed
   */
  async initializeSessionMonitoring() {
    // Check if user has a session (Supabase stores it in localStorage)
    const session = this.getStoredSession();
    if (!session) {
      console.log('ℹ️  No active session found');
      return;
    }

    this.session = session;
    console.log('✅ Active session detected, enabling auto-refresh');

    // Check session status immediately
    await this.checkSessionStatus();

    // Set up periodic session checks (every 5 minutes)
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionStatus();
    }, 5 * 60 * 1000);
  }

  /**
   * Get stored Supabase session from localStorage
   */
  getStoredSession() {
    try {
      const supabaseAuth = localStorage.getItem('sb-pnusmlckowqagnlzjqbv-auth-token');
      if (!supabaseAuth) return null;
      
      const authData = JSON.parse(supabaseAuth);
      return authData.access_token ? authData : null;
    } catch (error) {
      console.warn('Could not parse stored session:', error);
      return null;
    }
  }

  /**
   * Check session status with backend
   */
  async checkSessionStatus() {
    try {
      const session = this.getStoredSession();
      if (!session) {
        this.stopSessionMonitoring();
        return;
      }

      const response = await fetch(`${window.API_URL || '/api'}/auth/session-status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️  Session expired, attempting refresh...');
          await this.refreshSession();
        }
        return;
      }

      const data = await response.json();
      if (data.success && data.data.session) {
        const sessionInfo = data.data.session;
        
        // Check if session needs refresh (less than 15 minutes remaining)
        if (sessionInfo.needsRefresh && this.autoRefreshEnabled) {
          console.log('🔄 Session approaching expiry, auto-refreshing...');
          await this.refreshSession();
        }

        // Warn user if session will expire soon (less than 5 minutes)
        const expiresInMinutes = sessionInfo.expiresIn / (60 * 1000);
        if (expiresInMinutes < 5 && !this.sessionWarningShown) {
          this.showSessionWarning(Math.floor(expiresInMinutes));
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession() {
    try {
      const session = this.getStoredSession();
      if (!session || !session.refresh_token) {
        console.error('❌ No refresh token available');
        this.handleSessionExpired();
        return false;
      }

      console.log('🔄 Refreshing session token...');
      
      const response = await fetch(`${window.API_URL || '/api'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          refreshToken: session.refresh_token
        })
      });

      if (!response.ok) {
        console.error('❌ Session refresh failed:', response.status);
        this.handleSessionExpired();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data.session) {
        // Update stored session
        this.updateStoredSession(data.data.session);
        this.session = data.data.session;
        this.sessionWarningShown = false;
        
        console.log('✅ Session refreshed successfully');
        return true;
      } else {
        this.handleSessionExpired();
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      this.handleSessionExpired();
      return false;
    }
  }

  /**
   * Update stored Supabase session in localStorage
   */
  updateStoredSession(newSession) {
    try {
      const storageKey = 'sb-pnusmlckowqagnlzjqbv-auth-token';
      const currentAuth = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      const updatedAuth = {
        ...currentAuth,
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_at: newSession.expires_at,
        expires_in: newSession.expires_in
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedAuth));
    } catch (error) {
      console.error('Error updating stored session:', error);
    }
  }

  /**
   * Show session expiry warning to user
   */
  showSessionWarning(minutesRemaining) {
    this.sessionWarningShown = true;
    
    const message = `Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Activity will refresh it automatically.`;
    
    // Show as a toast/notification if you have a notification system
    // Otherwise, console warning
    console.warn(`⚠️  ${message}`);
    
    // Optional: Show UI notification
    if (window.showNotification) {
      window.showNotification(message, 'warning');
    }
  }

  /**
   * Handle expired session
   */
  handleSessionExpired() {
    console.error('❌ Session expired - redirecting to login');
    this.stopSessionMonitoring();
    
    // Clear stored session
    localStorage.removeItem('sb-pnusmlckowqagnlzjqbv-auth-token');
    
    // Redirect to login after short delay
    setTimeout(() => {
      if (window.location.pathname.includes('admin')) {
        window.location.href = '/admin-login.html?expired=true';
      } else {
        window.location.href = '/student-login.html?expired=true';
      }
    }, 1000);
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
      console.log('Session monitoring stopped');
    }
  }

  /**
   * Enable/disable auto-refresh
   */
  setAutoRefresh(enabled) {
    this.autoRefreshEnabled = enabled;
    console.log(`Auto-refresh ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Fetch new CSRF token from backend
   */
  async refreshCsrfToken() {
    try {
      const response = await fetch(`${window.API_URL || '/api'}/csrf-token`, {
        credentials: 'include' // Important for cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.csrfExpiry = new Date(data.expires);
      this.retryCount = 0;

      console.log('✅ CSRF token refreshed, expires:', this.csrfExpiry.toLocaleTimeString());
      return this.csrfToken;
    } catch (error) {
      console.error('❌ Failed to refresh CSRF token:', error);
      throw error;
    }
  }

  /**
   * Check if CSRF token is expired or about to expire
   */
  isTokenExpired() {
    if (!this.csrfToken || !this.csrfExpiry) return true;
    
    // Refresh if less than 5 minutes remaining
    const now = new Date();
    const timeRemaining = this.csrfExpiry - now;
    return timeRemaining < 5 * 60 * 1000; // 5 minutes in ms
  }

  /**
   * Get current CSRF token, refresh if needed
   */
  async getCsrfToken() {
    if (!this.csrfToken || this.isTokenExpired()) {
      await this.refreshCsrfToken();
    }
    return this.csrfToken;
  }

  /**
   * Enhanced fetch with CSRF protection
   * Automatically includes CSRF token for state-changing methods
   */
  async secureFetch(url, options = {}) {
    // Initialize if not done yet
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Prepare options
    const method = (options.method || 'GET').toUpperCase();
    const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    // Clone options to avoid mutation
    const fetchOptions = { ...options };
    fetchOptions.headers = { ...options.headers };

    // Add CSRF token for state-changing methods
    if (needsCsrf && this.csrfToken) {
      fetchOptions.headers['X-CSRF-Token'] = await this.getCsrfToken();
    }

    // Ensure credentials are included (for cookies)
    if (!fetchOptions.credentials) {
      fetchOptions.credentials = 'include';
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Handle CSRF errors
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        
        if (data.code === 'CSRF_VALIDATION_FAILED') {
          console.warn('⚠️  CSRF validation failed, refreshing token...');
          
          // Retry with fresh token
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            await this.refreshCsrfToken();
            return this.secureFetch(url, options); // Recursive retry
          } else {
            console.error('❌ Max CSRF retries exceeded');
            throw new Error('CSRF validation failed after multiple retries. Please refresh the page.');
          }
        }
      }

      // Reset retry count on success
      if (response.ok) {
        this.retryCount = 0;
      }

      return response;
    } catch (error) {
      // Handle network errors
      console.error('Network error:', error);
      throw error;
    }
  }

  /**
   * Secure POST request
   */
  async post(url, data, options = {}) {
    return this.secureFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Secure PUT request
   */
  async put(url, data, options = {}) {
    return this.secureFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Secure DELETE request
   */
  async delete(url, options = {}) {
    return this.secureFetch(url, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Secure GET request (no CSRF needed, but consistent interface)
   */
  async get(url, options = {}) {
    return this.secureFetch(url, {
      method: 'GET',
      ...options
    });
  }
}

/**
 * XSS Protection Utilities
 */
const XSSProtection = {
  /**
   * Escape HTML entities to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Sanitize user input for display
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Strip all HTML tags
   */
  stripHtml(html) {
    if (typeof html !== 'string') return html;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  /**
   * Validate URL to prevent javascript: and data: URLs
   */
  isSafeUrl(url) {
    if (typeof url !== 'string') return false;
    
    const lowerUrl = url.toLowerCase().trim();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      return false;
    }
    
    // Allow http, https, mailto, tel
    const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', '/'];
    return safeProtocols.some(protocol => lowerUrl.startsWith(protocol));
  }
};

/**
 * Input Validation Utilities
 */
const InputValidation = {
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@(st\.)?tau\.edu\.ng$/i;
    return regex.test(email);
  },

  /**
   * Validate password strength
   */
  isStrongPassword(password) {
    if (!password || password.length < 8) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]/.test(password);
    
    return hasUppercase && hasLowercase && hasDigit && hasSpecial;
  },

  /**
   * Validate matric number format
   */
  isValidMatricNo(matricNo) {
    if (!matricNo) return false;
    
    const patterns = [
      /^TAU\/[A-Z]{2,4}\/\d{2,4}\/\d{3,4}$/i,
      /^\d{4}\/[A-Z]{2,4}\/\d{2,4}$/i,
      /^\d{2}\/\d{2}[A-Z]{2,4}\d{3,4}$/i
    ];
    
    return patterns.some(pattern => pattern.test(matricNo.trim()));
  },

  /**
   * Validate phone number (Nigerian format)
   */
  isValidPhone(phone) {
    if (!phone) return true; // Optional field
    
    const cleaned = phone.replace(/\s/g, '');
    return /^(\+234|0)[789][01]\d{8}$/.test(cleaned);
  },

  /**
   * Get password strength indicator
   */
  getPasswordStrength(password) {
    if (!password) return { strength: 0, label: 'None', color: 'secondary' };
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]/.test(password)) strength++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['danger', 'danger', 'warning', 'info', 'success', 'success'];
    
    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength, 5)],
      color: colors[Math.min(strength, 5)]
    };
  }
};

/**
 * Rate Limiting Client-Side (UX improvement)
 */
class ClientRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  /**
   * Check if action should be rate limited (client-side only)
   * This is a UX feature, not a security feature
   */
  shouldLimit(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const timestamps = this.requests.get(key);
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    this.requests.set(key, validTimestamps);
    
    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      const oldestRequest = Math.min(...validTimestamps);
      const timeToWait = windowMs - (now - oldestRequest);
      
      return {
        limited: true,
        waitTime: Math.ceil(timeToWait / 1000), // seconds
        message: `Please wait ${Math.ceil(timeToWait / 1000)} seconds before trying again`
      };
    }
    
    // Add current request
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return { limited: false };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key) {
    this.requests.delete(key);
  }
}

// Create global instances
const securityManager = new SecurityManager();
const rateLimiter = new ClientRateLimiter();

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    securityManager.initialize().catch(console.error);
  });
} else {
  securityManager.initialize().catch(console.error);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    securityManager,
    XSSProtection,
    InputValidation,
    rateLimiter
  };
} else {
  // Browser global
  window.securityManager = securityManager;
  window.XSSProtection = XSSProtection;
  window.InputValidation = InputValidation;
  window.rateLimiter = rateLimiter;
}

console.log('🔒 Security module loaded');
