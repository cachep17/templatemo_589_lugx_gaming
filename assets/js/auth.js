// Authentication utility functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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
const db = getFirestore(app);

// Authentication utility class
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initAuthStateListener();
  }

  // Initialize authentication state listener
  initAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.updateAuthUI();
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
    });
  }

  // Wait for authentication state to be determined
  waitForAuthState() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        unsubscribe();
        resolve(user);
      });
    });
  }

  // Update authentication UI based on user state
  updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
      if (this.currentUser) {
        // Display username or email
        const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        authLink.innerHTML = `<i class="fa fa-user"></i> ${displayName} <i class="fa fa-sign-out" style="margin-left: 10px;"></i>`;
        authLink.href = '#';
        authLink.onclick = (e) => {
          e.preventDefault();
          this.signOut();
        };
        authLink.title = 'Click to sign out';
      } else {
        authLink.innerHTML = '<i class="fa fa-sign-in"></i> Sign In';
        authLink.href = 'login.html';
        authLink.onclick = null;
        authLink.title = 'Sign in to your account';
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    console.log('Checking authentication state:', this.currentUser);
    return this.currentUser !== null && this.currentUser !== undefined;
  }

  // Get current user with real-time Firebase check
  async getCurrentUserAsync() {
    console.log('getCurrentUserAsync called');
    return new Promise((resolve) => {
      console.log('Setting up onAuthStateChanged listener');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('onAuthStateChanged triggered with user:', user);
        unsubscribe();
        resolve(user);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        console.log('getCurrentUserAsync timeout - using current auth state');
        unsubscribe();
        resolve(auth.currentUser);
      }, 3000);
    });
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign up user
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Store purchase data for later retrieval
  storePurchaseData(gameData, quantity) {
    const purchaseData = {
      game: gameData,
      quantity: quantity,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingPurchase', JSON.stringify(purchaseData));
  }

  // Get stored purchase data
  getPurchaseData() {
    const data = sessionStorage.getItem('pendingPurchase');
    return data ? JSON.parse(data) : null;
  }

  // Clear purchase data
  clearPurchaseData() {
    sessionStorage.removeItem('pendingPurchase');
  }

  // Redirect to checkout if authenticated, otherwise redirect to login
  async handlePurchase(gameData, quantity) {
    console.log('HandlePurchase called, checking auth state...');
    console.log('Game data received:', gameData);
    console.log('Quantity received:', quantity);

    try {
      // Check Firebase auth directly first
      const firebaseCurrentUser = auth.currentUser;
      console.log('Firebase auth.currentUser:', firebaseCurrentUser);

      if (firebaseCurrentUser) {
        console.log('User is authenticated via Firebase auth.currentUser');
        console.log('User email:', firebaseCurrentUser.email);
        console.log('User display name:', firebaseCurrentUser.displayName);

        // Create order directly and redirect to confirmation
        console.log('Creating order directly...');
        const orderId = await this.createOrderDirectly(gameData, quantity, firebaseCurrentUser);

        if (orderId) {
          console.log('Order created successfully, redirecting to confirmation page...');
          // console.log('Redirect URL:', `order-confirmation.html?orderId=${orderId}`);

          // Clear any pending purchase data since order is complete
          this.clearPurchaseData();

          // Use setTimeout to ensure the redirect happens after all processing
          // setTimeout(() => {
          //   window.location.href = `order-confirmation.html?orderId=${orderId}`;
          // }, 100);

          return orderId; // Return early to prevent further execution
        } else {
          console.error('Failed to create order');
          alert('Failed to create order. Please try again.');
          return;
        }
        return;
      }

      // Fallback: Get the current authentication state from onAuthStateChanged
      console.log('Fallback: using getCurrentUserAsync...');
      const currentUser = await this.getCurrentUserAsync();
      console.log('getCurrentUserAsync returned:', currentUser);

      this.currentUser = currentUser;

      if (currentUser) {
        console.log('User is authenticated via getCurrentUserAsync');
        // Create order directly and redirect to confirmation
        const orderId = await this.createOrderDirectly(gameData, quantity, currentUser);

        if (orderId) {
          console.log('Order created successfully via fallback, redirecting to confirmation page...');
          console.log('Redirect URL:', `order-confirmation.html?orderId=${orderId}`);

          // Clear any pending purchase data since order is complete
          this.clearPurchaseData();

          // Use setTimeout to ensure the redirect happens after all processing
          // setTimeout(() => {
          //   window.location.href = `order-confirmation.html?orderId=${orderId}`;
          // }, 100);

          return orderId; // Return early to prevent further execution
        } else {
          console.error('Failed to create order');
          alert('Failed to create order. Please try again.');
          return;
        }
      } else {
        console.log('User not authenticated, redirecting to login');
        // Store purchase data and redirect to login
        this.storePurchaseData(gameData, quantity);
        const redirectUrl = `login.html?redirect=purchase&game=${gameData.url}&qty=${quantity}`;
        console.log('Login redirect URL:', redirectUrl);
        window.location.href = redirectUrl;
        return; // Ensure we don't continue execution
      }
    } catch (error) {
      console.error('Error in handlePurchase:', error);
      console.error('Error stack:', error.stack);
      alert('Error processing purchase: ' + error.message);
    }
  }

  // Test function to manually check auth state (for debugging)
  testAuthState() {
    console.log('=== AUTH STATE TEST ===');
    console.log('this.currentUser:', this.currentUser);
    console.log('auth.currentUser:', auth.currentUser);
    console.log('isAuthenticated():', this.isAuthenticated());

    // Also check Firebase auth directly
    onAuthStateChanged(auth, (user) => {
      console.log('Firebase onAuthStateChanged result:', user);
    });
  }

  // Create order directly without checkout form
  async createOrderDirectly(gameData, quantity, user) {
    try {
      console.log('Creating order with data:', { gameData, quantity, user: user.email });

      // Calculate order totals
      const unitPrice = parseFloat(gameData.salePrice || gameData.Price);
      const subtotal = unitPrice * quantity;
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      // Create order data with minimal required information
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        gameId: gameData.id || gameData.Name, // Use name as fallback ID
        gameName: gameData.Name,
        gameUrl: gameData.url,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        tax: tax,
        total: total,
        customerInfo: {
          fullName: user.displayName || user.email.split('@')[0],
          email: user.email,
          address: 'Digital delivery - No physical address required',
          city: 'N/A',
          zip: 'N/A'
        },
        paymentMethod: 'instant_purchase',
        paymentDetails: {
          method: 'Digital wallet / Account credit',
          status: 'completed'
        },
        orderDate: new Date(),
        status: 'confirmed', // Skip pending since it's instant
        deliveryMethod: 'digital',
        notes: 'Instant purchase - Digital delivery'
      };

      console.log('Order data prepared:', orderData);

      // Save order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      console.log('✅ Order successfully saved to Firestore with ID:', orderRef.id);
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }
}

// Add global debugging function
window.debugAuth = () => {
  if (window.authManager) {
    window.authManager.testAuthState();
  } else {
    console.log('Auth manager not available');
  }
};

export default AuthManager;
