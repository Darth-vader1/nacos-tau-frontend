import { supabase } from './supabase-config.js';

const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname === '';

const API_URL = (window.__CONFIG && window.__CONFIG.apiUrl) ||
    window.API_URL ||
    (isLocal ? 'http://localhost:5000/api' : 'https://nacos-tau-frontend.onrender.com/api');

// Make API_URL available globally
window.API_URL = API_URL;

/**
 * Secure API wrapper using SecurityManager
 * Falls back to regular fetch if SecurityManager not available
 */
async function secureRequest(method, url, options = {}) {
    // Use SecurityManager if available
    if (window.securityManager && window.securityManager.isInitialized) {
        return window.securityManager.secureFetch(url, {
            method,
            ...options
        });
    }

    // Fallback to regular fetch
    return fetch(url, {
        method,
        ...options
    });
}

export const api = {
    auth: {
        async verify() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            return response.json();
        },

        async login(email, password) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email, password
            });

            if (error) throw error;

            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${data.session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            return data;
        },

        async adminLogin(email, password) {
            const response = await fetch(`${API_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            return response.json();
        },

        async register(studentData) {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            return response.json();
        }
    },

    students: {
        async getProfile() {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/students/me`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async updateProfile(data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/students/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },

        async list(params = {}) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { success: false, error: 'Not authenticated' };
            }
            const qs = new URLSearchParams();
            const { page, limit, search, status, department } = params;
            if (page != null && page !== '' && !Number.isNaN(Number(page))) qs.set('page', String(page));
            if (limit != null && limit !== '' && !Number.isNaN(Number(limit))) qs.set('limit', String(limit));
            if (search && String(search).trim() !== '') qs.set('search', String(search).trim());
            // Omit status when "all" — absence means "no status filter" (all rows).
            const s = (typeof status === 'string') ? status.trim().toLowerCase() : '';
            if (s && s !== 'all') qs.set('status', s);
            if (department && String(department).trim() !== '') qs.set('department', String(department).trim());
            const url = `${API_URL}/students${qs.toString() ? `?${qs.toString()}` : ''}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            return response.json();
        },

        async remove(studentId) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await fetch(`${API_URL}/students/${encodeURIComponent(studentId)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            return response.json();
        }
    },

    events: {
        async getUpcoming() {
            const response = await fetch(`${API_URL}/events/upcoming`);
            return response.json();
        },

        async register(eventId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        }
    },

    resources: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/resources?${queryString}`);
            return response.json();
        },

        async download(id) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/resources/${id}/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        }
    },

    payments: {
        async submit(data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/payments/submit`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },

        async getMyPayments() {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('GET', `${API_URL}/payments/my`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        }
    },

    career: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/career?${queryString}`);
            return response.json();
        },

        async save(id) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/career/${id}/save`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async getSaved() {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/career/saved/my`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        }
    },

    voting: {
        async getPositions() {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('GET', `${API_URL}/voting/positions`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async getCandidates(positionId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('GET', `${API_URL}/voting/positions/${positionId}/candidates`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async vote(positionId, candidateId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/voting/vote`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ position_id: positionId, candidate_id: candidateId })
            });
            return response.json();
        }
    },

    hackathons: {
        async list(filter = {}) {
            let eventType = '';
            let status = '';
            if (typeof filter === 'string') {
                const lower = filter.trim().toLowerCase();
                if (lower === 'hackathon' || lower === 'pitchathon') {
                    eventType = lower;
                } else if (lower) {
                    status = lower;
                }
            } else if (typeof filter === 'object' && filter !== null) {
                eventType = filter.event_type || filter.eventType || '';
                status = filter.status || '';
            }
            const params = new URLSearchParams();
            if (eventType) params.set('event_type', eventType);
            if (status) params.set('status', status);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const response = await fetch(`${API_URL}/hackathons${qs}`);
            return response.json();
        },
        async past() {
            const response = await fetch(`${API_URL}/hackathons/past`);
            return response.json();
        },
        async openTeams(hackathonId = '') {
            const qs = hackathonId ? `?hackathon_id=${encodeURIComponent(hackathonId)}` : '';
            const response = await fetch(`${API_URL}/hackathons/open-teams${qs}`);
            return response.json();
        },
        async get(slugOrId) {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
            const response = await fetch(`${API_URL}/hackathons/${slugOrId}`, { headers });
            return response.json();
        },
        async register(hackathonId, data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/hackathons/${hackathonId}/register`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        async submit(hackathonId, data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/hackathons/${hackathonId}/submit`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        async adminCreate(data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/hackathons/admin/create`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        async adminGetParticipants(hackathonId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('GET', `${API_URL}/hackathons/admin/${hackathonId}/participants`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },
        async adminAssignWinner(subId, data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('POST', `${API_URL}/hackathons/admin/submissions/${subId}/winner`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        async adminUpdateStatus(hackathonId, status) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await secureRequest('PATCH', `${API_URL}/hackathons/admin/${hackathonId}/status`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ status })
            });
            return response.json();
        }
    }
};

window.api = api;
