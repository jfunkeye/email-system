// Configuration
const CONFIG = {
    API_BASE_URL: 'https://your-backend.onrender.com',
    APP_NAME: 'AuthSystem',
    TOKEN_KEY: 'authToken',
    USER_KEY: 'userData'
};

// Utility functions
const Utils = {
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            setTimeout(() => {
                const alert = notification.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    },

    // Get token from localStorage
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Set token in localStorage
    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },

    // Remove token from localStorage
    removeToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
    },

    // Get user data from localStorage
    getUser() {
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Set user data in localStorage
    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    // Remove user data from localStorage
    removeUser() {
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Redirect to page
    redirectTo(url) {
        window.location.href = url;
    },

    // Format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// API Utility Functions
const API = {
    // Generic API call function
    async call(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = Utils.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        login: (credentials) => API.call('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        
        signup: (userData) => API.call('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        
        verifyEmail: (token) => API.call(`/api/auth/verify-email?token=${token}`),
        
        forgotPassword: (email) => API.call('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
        
        resetPassword: (data) => API.call('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        
        getMe: () => API.call('/api/auth/me')
    },

    // User endpoints
    user: {
        changePassword: (data) => API.call('/api/user/change-password', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        
        updateProfile: (data) => API.call('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }
};

// Form handling utilities
const FormHandler = {
    // Show loading state
    setLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
        }
    },

    // Initialize form
    init(formId, submitCallback) {
        const form = document.getElementById(formId);
        if (!form) return;

        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;
        
        // Store original button text
        submitButton.setAttribute('data-original-text', submitButton.innerHTML);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            this.setLoading(submitButton, true);
            
            try {
                await submitCallback(data);
            } catch (error) {
                Utils.showNotification(error.message, 'danger');
            } finally {
                this.setLoading(submitButton, false);
            }
        });
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for protected pages
    if (window.location.pathname.includes('dashboard')) {
        if (!Utils.isAuthenticated()) {
            Utils.redirectTo('login.html');
            return;
        }
    }
    
    // Check if user is already logged in
    if (window.location.pathname.includes('login') || 
        window.location.pathname.includes('signup') ||
        window.location.pathname.includes('forgot-password') ||
        window.location.pathname.includes('reset-password')) {
        if (Utils.isAuthenticated()) {
            Utils.redirectTo('dashboard.html');
            return;
        }
    }
});