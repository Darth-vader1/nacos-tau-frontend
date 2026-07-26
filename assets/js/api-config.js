// frontend/assets/js/api-config.js
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
   :'https://nacos-backend.up.railway.app/api'; // Update with your Render URL

export const api = {
    // ============================================
    // AUTH ENDPOINTS
    // ============================================
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
            // First, try Supabase auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email, password
            });
            
            if (error) throw error;
            
            // Then verify with backend
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

    // ============================================
    // STUDENT ENDPOINTS
    // ============================================
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
        }
    },

    // ============================================
    // EVENTS ENDPOINTS
    // ============================================
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

    // ============================================
    // RESOURCES ENDPOINTS
    // ============================================
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

    // ============================================
    // PAYMENT ENDPOINTS
    // ============================================
    payments: {
        async submit(data) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/payments/submit`, {
                method: 'POST',
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
            const response = await fetch(`${API_URL}/payments/my`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        }
    },

    // ============================================
    // CAREER ENDPOINTS
    // ============================================
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

    // ============================================
    // VOTING ENDPOINTS
    // ============================================
    voting: {
        async getPositions() {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/voting/positions`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async getCandidates(positionId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/voting/positions/${positionId}/candidates`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            return response.json();
        },

        async vote(positionId, candidateId) {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/voting/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ position_id: positionId, candidate_id: candidateId })
            });
            return response.json();
        }
    }
};