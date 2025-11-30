// Authentication functions
const Auth = {
    // Login function
    async login(credentials) {
        try {
            const result = await API.auth.login(credentials);
            
            if (result.success) {
                Utils.setToken(result.data.token);
                Utils.setUser(result.data.user);
                Utils.showNotification('Login successful!', 'success');
                
                setTimeout(() => {
                    Utils.redirectTo('dashboard.html');
                }, 1000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    },

    // Signup function
    async signup(userData) {
        try {
            // Validate password match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Remove confirmPassword before sending to API
            const { confirmPassword, ...userDataToSend } = userData;
            
            const result = await API.auth.signup(userDataToSend);
            
            if (result.success) {
                Utils.showNotification(
                    'Registration successful! Please check your email for verification.',
                    'success'
                );
                
                setTimeout(() => {
                    Utils.redirectTo('login.html');
                }, 3000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    },

    // Logout function
    logout() {
        Utils.removeToken();
        Utils.removeUser();
        Utils.showNotification('Logged out successfully', 'info');
        setTimeout(() => {
            Utils.redirectTo('login.html');
        }, 1000);
    },

    // Forgot password
    async forgotPassword(email) {
        try {
            const result = await API.auth.forgotPassword(email);
            
            if (result.success) {
                Utils.showNotification(
                    'If the email exists, a password reset code has been sent.',
                    'success'
                );
                
                setTimeout(() => {
                    Utils.redirectTo('login.html');
                }, 3000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Password reset request failed');
        }
    },

    // Reset password
    async resetPassword(data) {
        try {
            // Validate password match
            if (data.newPassword !== data.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const result = await API.auth.resetPassword({
                token: data.token,
                newPassword: data.newPassword
            });
            
            if (result.success) {
                Utils.showNotification('Password reset successfully!', 'success');
                
                setTimeout(() => {
                    Utils.redirectTo('login.html');
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Password reset failed');
        }
    },

    // Verify email
    async verifyEmail(token) {
        try {
            const result = await API.auth.verifyEmail(token);
            
            if (result.success) {
                Utils.showNotification('Email verified successfully!', 'success');
                
                setTimeout(() => {
                    Utils.redirectTo('login.html');
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Email verification failed');
        }
    },

    // Resend verification email
    async resendVerification(email) {
        try {
            const result = await API.call('/api/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            if (result.success) {
                Utils.showNotification('Verification email sent successfully!', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            throw new Error(error.message || 'Failed to send verification email');
        }
    }
};

// Initialize auth pages
document.addEventListener('DOMContentLoaded', function() {
    // Login page
    if (document.getElementById('loginForm')) {
        FormHandler.init('loginForm', async (data) => {
            await Auth.login(data);
        });
    }

    // Signup page
    if (document.getElementById('signupForm')) {
        FormHandler.init('signupForm', async (data) => {
            await Auth.signup(data);
        });

        // Add real-time password validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value !== password.value) {
                    this.setCustomValidity('Passwords do not match');
                } else {
                    this.setCustomValidity('');
                }
            });
        }
    }

    // Forgot password page
    if (document.getElementById('forgotPasswordForm')) {
        FormHandler.init('forgotPasswordForm', async (data) => {
            await Auth.forgotPassword(data.email);
        });
    }

    // Reset password page
    if (document.getElementById('resetPasswordForm')) {
        // Get token from URL and populate the field
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        const tokenInput = document.getElementById('resetToken');
        const codeInput = document.getElementById('verificationCode');
        
        if (token && tokenInput) {
            tokenInput.value = token;
        }
        if (token && codeInput) {
            codeInput.value = token;
        }

        FormHandler.init('resetPasswordForm', async (data) => {
            await Auth.resetPassword(data);
        });

        // Add password strength and matching validation
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (newPassword && confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value !== newPassword.value) {
                    this.setCustomValidity('Passwords do not match');
                } else {
                    this.setCustomValidity('');
                }
            });
        }
    }

    // Verify email page - handle automatic verification
    if (window.location.pathname.includes('verify-email.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            // Show loading state
            const loadingState = document.getElementById('loadingState');
            const successState = document.getElementById('successState');
            const errorState = document.getElementById('errorState');
            const resendSection = document.getElementById('resendSection');

            if (loadingState) loadingState.style.display = 'block';
            if (successState) successState.style.display = 'none';
            if (errorState) errorState.style.display = 'none';
            if (resendSection) resendSection.style.display = 'none';

            Auth.verifyEmail(token)
                .then(() => {
                    if (loadingState) loadingState.style.display = 'none';
                    if (successState) successState.style.display = 'block';
                })
                .catch((error) => {
                    if (loadingState) loadingState.style.display = 'none';
                    if (errorState) {
                        errorState.style.display = 'block';
                        const errorMessage = document.getElementById('errorMessage');
                        if (errorMessage) {
                            errorMessage.textContent = error.message;
                        }
                    }
                    if (resendSection) resendSection.style.display = 'block';
                });
        } else {
            Utils.showNotification('No verification token provided', 'danger');
            
            const loadingState = document.getElementById('loadingState');
            const errorState = document.getElementById('errorState');
            const resendSection = document.getElementById('resendSection');
            
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            if (resendSection) resendSection.style.display = 'block';
        }

        // Handle resend verification form
        const resendForm = document.getElementById('resendVerificationForm');
        if (resendForm) {
            resendForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(resendForm);
                const email = formData.get('email');
                
                try {
                    await Auth.resendVerification(email);
                } catch (error) {
                    Utils.showNotification(error.message, 'danger');
                }
            });
        }
    }
});