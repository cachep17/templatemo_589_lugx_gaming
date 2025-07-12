// Initialize authentication on main pages
import AuthManager from './auth.js';

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Main-auth initializing...');

  // Only create if not already exists
  if (!window.authManager) {
    console.log('Creating new auth manager...');
    try {
      const authManager = new AuthManager();
      window.authManager = authManager;
      console.log('Auth manager initialized and set to window.authManager');
      console.log('Auth manager methods:', Object.getOwnPropertyNames(authManager));
      console.log('handlePurchase method exists:', typeof authManager.handlePurchase);
    } catch (error) {
      console.error('Error creating auth manager:', error);
    }
  } else {
    console.log('Auth manager already exists');
    console.log('Existing auth manager methods:', Object.getOwnPropertyNames(window.authManager));
  }
});

console.log('Main-auth.js loaded');
