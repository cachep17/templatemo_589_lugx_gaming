// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import AuthManager from './auth.js';

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
const db = getFirestore(app);

class CheckoutManager {
  constructor() {
    this.gameData = null;
    this.quantity = 1;
    this.authManager = new AuthManager();
    this.init();
  }

  async init() {
    // Check if user is authenticated
    if (!this.authManager.isAuthenticated()) {
      // Redirect to login if not authenticated
      const urlParams = new URLSearchParams(window.location.search);
      const gameParam = urlParams.get('game');
      const qtyParam = urlParams.get('qty');
      // window.location.href = `login.html?redirect=checkout&game=${gameParam}&qty=${qtyParam}`;
      return;
    }

    // Load game data and setup UI
    await this.loadGameData();
    this.setupEventListeners();
    this.updateOrderSummary();
    this.populateUserInfo();
  }

  async loadGameData() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');
    const qty = urlParams.get('qty') || 1;

    this.quantity = parseInt(qty);

    if (gameName) {
      try {
        const gameQuery = query(collection(db, "game"), where("url", "==", gameName));
        const querySnapshot = await getDocs(gameQuery);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          this.gameData = doc.data();
          this.gameData.id = doc.id;
        }
      } catch (error) {
        console.error("Error loading game data:", error);
      }
    }

    // Fallback: try to get data from session storage
    if (!this.gameData) {
      const purchaseData = this.authManager.getPurchaseData();
      if (purchaseData) {
        this.gameData = purchaseData.game;
        this.quantity = purchaseData.quantity;
      }
    }

    if (!this.gameData) {
      alert('Game data not found. Please go back to the product page.');
      window.location.href = 'shop.html';
    }
  }

  populateUserInfo() {
    const user = this.authManager.getCurrentUser();
    if (user) {
      document.getElementById('email').value = user.email;
    }
  }

  updateOrderSummary() {
    if (!this.gameData) return;

    // Update game info
    document.getElementById('checkout-game-name').textContent = this.gameData.Name;
    document.getElementById('checkout-game-description').textContent = this.gameData.Description;
    document.getElementById('checkout-game-image').src = this.gameData.thumbnail;

    // Update prices
    const oldPrice = parseFloat(this.gameData.Price);
    const newPrice = parseFloat(this.gameData.salePrice);

    document.getElementById('checkout-old-price').textContent = `$${oldPrice}`;
    document.getElementById('checkout-new-price').textContent = `$${newPrice}`;

    // Update quantity
    document.getElementById('quantity').value = this.quantity;

    // Calculate totals
    this.calculateTotals();
  }

  calculateTotals() {
    if (!this.gameData) return;

    const price = parseFloat(this.gameData.salePrice);
    const subtotal = price * this.quantity;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
  }

  setupEventListeners() {
    // Quantity change
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('change', (e) => {
      this.quantity = parseInt(e.target.value) || 1;
      this.calculateTotals();
    });

    // Payment method toggle
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const creditCardDetails = document.getElementById('credit-card-details');
        if (e.target.value === 'credit-card') {
          creditCardDetails.style.display = 'block';
        } else {
          creditCardDetails.style.display = 'none';
        }
      });
    });

    // Form submission
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processOrder();
    });

    // Card number formatting
    const cardNumberInput = document.getElementById('card-number');
    cardNumberInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = value;
    });

    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    expiryInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });

    // CVV validation
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  async processOrder() {
    const user = this.authManager.getCurrentUser();
    if (!user || !this.gameData) {
      alert('Error: Missing user or game data');
      return;
    }

    // Collect form data
    const formData = {
      userId: user.uid,
      userEmail: user.email,
      gameId: this.gameData.id,
      gameName: this.gameData.Name,
      quantity: this.quantity,
      unitPrice: parseFloat(this.gameData.salePrice),
      subtotal: parseFloat(this.gameData.salePrice) * this.quantity,
      tax: parseFloat(this.gameData.salePrice) * this.quantity * 0.1,
      total: (parseFloat(this.gameData.salePrice) * this.quantity) * 1.1,
      customerInfo: {
        fullName: document.getElementById('full-name').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        zip: document.getElementById('zip').value
      },
      paymentMethod: document.querySelector('input[name="payment"]:checked').value,
      orderDate: new Date(),
      status: 'pending'
    };

    // Add payment details (in real app, this should be encrypted)
    if (formData.paymentMethod === 'credit-card') {
      formData.paymentDetails = {
        cardNumber: document.getElementById('card-number').value.replace(/\s/g, '').slice(-4), // Only store last 4 digits
        expiryDate: document.getElementById('expiry').value
      };
    }

    try {
      // Save order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), formData);

      // Clear purchase data from session
      this.authManager.clearPurchaseData();

      // Show success message and redirect
      alert('Order placed successfully! Order ID: ' + orderRef.id);
      window.location.href = `order-confirmation.html?orderId=${orderRef.id}`;

    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    }
  }
}

// Initialize checkout when page loads
document.addEventListener('DOMContentLoaded', () => {
  new CheckoutManager();
});
