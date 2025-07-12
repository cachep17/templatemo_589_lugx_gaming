// Signup page functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiLrnJC3U1y5uq5nLO5y_91mvHY_3aRuE",
  authDomain: "game-demo-1707.firebaseapp.com",
  projectId: "game-demo-1707",
  storageBucket: "game-demo-1707.firebasestorage.app",
  messagingSenderId: "185489419922",
  appId: "1:185489419922:web:ea13d1425abe767d92c04b",
  measurementId: "G-FDJMVKPHF2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class SignupManager {
  constructor() {
    this.init();
  }

  init() {
    // Check if user is already logged in
    if (auth.currentUser) {
      window.location.href = '../index.html';
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }

    // Add real-time password confirmation validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    if (passwordInput && confirmPasswordInput) {
      passwordInput.addEventListener('input', () => {
        this.validatePasswordStrength();
        this.validatePasswordMatch();
      });

      confirmPasswordInput.addEventListener('input', () => {
        this.validatePasswordMatch();
      });
    }
  }

  validatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthIndicator = document.getElementById('password-strength');

    if (!strengthIndicator) return;

    let strength = 0;
    let feedback = '';

    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    switch (strength) {
      case 0:
      case 1:
        strengthIndicator.className = 'password-strength weak';
        feedback = 'Mật khẩu rất yếu';
        break;
      case 2:
        strengthIndicator.className = 'password-strength weak';
        feedback = 'Mật khẩu yếu';
        break;
      case 3:
        strengthIndicator.className = 'password-strength medium';
        feedback = 'Mật khẩu trung bình';
        break;
      case 4:
        strengthIndicator.className = 'password-strength strong';
        feedback = 'Mật khẩu mạnh';
        break;
      case 5:
        strengthIndicator.className = 'password-strength strong';
        feedback = 'Mật khẩu rất mạnh';
        break;
    }

    strengthIndicator.textContent = feedback;
  }

  validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const confirmInput = document.getElementById('confirm_password');
    const errorElement = document.getElementById('confirm-password-error');

    if (confirmPassword && password !== confirmPassword) {
      confirmInput.style.borderColor = '#ff4444';
      if (errorElement) {
        errorElement.style.display = 'block';
      }
      confirmInput.setCustomValidity('Mật khẩu không khớp');
    } else {
      confirmInput.style.borderColor = confirmPassword ? '#28a745' : '';
      if (errorElement) {
        errorElement.style.display = 'none';
      }
      confirmInput.setCustomValidity('');
    }
  }

  validateForm() {
    const firstName = document.getElementById('firstname').value.trim();
    const lastName = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Email không hợp lệ');
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      alert('Mật khẩu không khớp');
      return false;
    }

    // Validate username (no spaces, minimum 3 characters)
    if (username.length < 3) {
      alert('Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }

    if (/\s/.test(username)) {
      alert('Tên đăng nhập không được chứa khoảng trắng');
      return false;
    }

    return true;
  }

  async handleSignup() {
    if (!this.validateForm()) {
      return;
    }

    const firstName = document.getElementById('firstname').value.trim();
    const lastName = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Đang đăng ký...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Show success message
      alert('Đăng ký thành công! Chào mừng bạn đến với LUGX Gaming!');

      // Redirect to home page or login page
      window.location.href = '../index.html';

    } catch (error) {
      console.error('Signup error:', error);

      // Handle specific Firebase auth errors
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email này đã được sử dụng. Vui lòng chọn email khác.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Đăng ký bằng email/mật khẩu chưa được kích hoạt.';
          break;
        default:
          errorMessage = error.message;
      }

      alert(errorMessage);

      // Restore button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }
}

// Initialize signup manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new SignupManager();
});
