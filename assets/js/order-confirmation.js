// Order confirmation page functionality
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  collection
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

class OrderConfirmationManager {
  constructor() {
    this.authManager = new AuthManager();
    this.orderId = null;
    this.init();
  }

  async init() {
    // Check if user is authenticated
    if (!this.authManager.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.orderId = urlParams.get('orderId');

    if (!this.orderId) {
      alert('Order not found');
      window.location.href = 'shop.html';
      return;
    }

    await this.loadOrderDetails();
  }

  async loadOrderDetails() {
    try {
      // Get order document
      const orderDoc = await getDoc(doc(db, "orders", this.orderId));

      if (!orderDoc.exists()) {
        alert('Order not found');
        window.location.href = 'shop.html';
        return;
      }

      const orderData = orderDoc.data();

      // Get game details
      const gameQuery = query(collection(db, "game"), where("Name", "==", orderData.gameName));
      const gameSnapshot = await getDocs(gameQuery);
      let gameData = null;

      if (!gameSnapshot.empty) {
        gameData = gameSnapshot.docs[0].data();
      }

      this.displayOrderDetails(orderData, gameData);

    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Error loading order details');
    }
  }

  displayOrderDetails(orderData, gameData) {
    // Order information
    document.getElementById('order-id').textContent = this.orderId;
    document.getElementById('order-date').textContent = new Date(orderData.orderDate.seconds * 1000).toLocaleDateString();
    document.getElementById('order-status').textContent = orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1);

    // Game details
    if (gameData) {
      document.getElementById('game-image').src = gameData.thumbnail || 'assets/images/placeholder.jpg';
    }
    document.getElementById('game-name').textContent = orderData.gameName;
    document.getElementById('game-quantity').textContent = orderData.quantity;
    document.getElementById('unit-price').textContent = orderData.unitPrice.toFixed(2);
    document.getElementById('order-total').textContent = orderData.total.toFixed(2);

    // Customer information
    document.getElementById('customer-email').textContent = orderData.userEmail;
    document.getElementById('customer-name').textContent = orderData.customerInfo.fullName;
    document.getElementById('customer-address').textContent =
      `${orderData.customerInfo.address}, ${orderData.customerInfo.city}, ${orderData.customerInfo.zip}`;
  }
}

// Initialize order confirmation manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new OrderConfirmationManager();
});
