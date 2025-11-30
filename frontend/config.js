// Configuration
const CONFIG = {
    API_BASE_URL: 'https://email-system-jrie.onrender.com',
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
