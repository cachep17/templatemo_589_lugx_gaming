// Login page functionality
import AuthManager from './auth.js';

class LoginManager {
  constructor() {
    this.authManager = new AuthManager();
    this.init();
  }

  init() {
    // Check if user is already logged in
    if (this.authManager.isAuthenticated()) {
      this.handleRedirect();
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
  }

  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Đang đăng nhập...';
    submitButton.disabled = true;

    try {
      const result = await this.authManager.signIn(username, password);

      if (result.success) {
        // Login successful, handle redirect
        this.handleRedirect();
      } else {
        // Login failed
        alert('Đăng nhập thất bại: ' + result.error);
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  handleRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const gameParam = urlParams.get('game');
    const qtyParam = urlParams.get('qty');

    if (redirect === 'checkout' && gameParam) {
      // Redirect to checkout page with game parameters
      window.location.href = `checkout.html?game=${gameParam}&qty=${qtyParam || 1}`;
    } else if (redirect === 'purchase' && gameParam) {
      // Redirect back to product page to trigger purchase again
      window.location.href = `product-details.html?game=${gameParam}`;
    } else {
      // Redirect to home page or previous page
      window.location.href = 'index.html';
    }
  }
}

// Initialize login manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new LoginManager();
});
