// Dashboard functionality
const Dashboard = {
    currentUser: null,

    // Initialize dashboard
    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
    },

    // Load user data
    async loadUserData() {
        try {
            const result = await API.auth.getMe();
            
            if (result.success) {
                this.currentUser = result.data.user;
                Utils.setUser(this.currentUser);
                this.updateUserInfo();
            } else {
                throw new Error('Failed to load user data');
            }
        } catch (error) {
            Utils.showNotification('Failed to load user data', 'danger');
            Auth.logout();
        }
    },

    // Update user information in UI
    updateUserInfo() {
        if (this.currentUser) {
            // Update welcome message
            const welcomeElement = document.getElementById('welcomeMessage');
            if (welcomeElement) {
                welcomeElement.textContent = `Welcome back, ${this.currentUser.firstName}!`;
            }

            // Update user info in profile section
            document.getElementById('userFullName').textContent = 
                `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            document.getElementById('userEmail').textContent = this.currentUser.email;
            document.getElementById('userJoinDate').textContent = 
                Utils.formatDate(this.currentUser.createdAt);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }

        // Change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.changePassword();
            });
        }

        // Update profile form
        const updateProfileForm = document.getElementById('updateProfileForm');
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateProfile();
            });
        }
    },

    // Change password
    async changePassword() {
        const form = document.getElementById('changePasswordForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const button = form.querySelector('button[type="submit"]');

        // Validation
        if (data.newPassword !== data.confirmPassword) {
            Utils.showNotification('New passwords do not match', 'danger');
            return;
        }

        if (data.newPassword.length < 6) {
            Utils.showNotification('Password must be at least 6 characters', 'danger');
            return;
        }

        try {
            FormHandler.setLoading(button, true);
            
            const result = await API.user.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            if (result.success) {
                Utils.showNotification('Password changed successfully!', 'success');
                form.reset();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Utils.showNotification(error.message, 'danger');
        } finally {
            FormHandler.setLoading(button, false);
        }
    },

    // Update profile
    async updateProfile() {
        const form = document.getElementById('updateProfileForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const button = form.querySelector('button[type="submit"]');

        try {
            FormHandler.setLoading(button, true);
            
            const result = await API.user.updateProfile({
                firstName: data.firstName,
                lastName: data.lastName
            });

            if (result.success) {
                Utils.showNotification('Profile updated successfully!', 'success');
                this.currentUser = result.data.user;
                this.updateUserInfo();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Utils.showNotification(error.message, 'danger');
        } finally {
            FormHandler.setLoading(button, false);
        }
    },

    // Update UI based on current section
    updateUI() {
        // Set active nav link
        const currentPage = window.location.hash.replace('#', '') || 'overview';
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentPage}`) {
                link.classList.add('active');
            }
        });

        // Show current section
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            section.classList.add('d-none');
        });

        const activeSection = document.getElementById(`${currentPage}Section`);
        if (activeSection) {
            activeSection.classList.remove('d-none');
        }
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dashboard')) {
        Dashboard.init();
        
        // Handle hash changes for navigation
        window.addEventListener('hashchange', function() {
            Dashboard.updateUI();
        });
        
        // Initial UI update
        Dashboard.updateUI();
    }
});