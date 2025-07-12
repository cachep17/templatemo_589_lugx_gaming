// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
// Removed local AuthManager import - using global instance instead
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Use global auth manager instead of creating local instance
// The auth manager is initialized in main-auth.js and available as window.authManager

var gameName = location.search.split("game=")[1];
console.log("🚀 ~ gameName:", gameName);

// Store current game data globally
let currentGameData = null;
async function getProductDetail() {
  const productCollection = query(
    collection(db, "game"),
    where("url", "==", gameName)
  );
  const querySnapshot = await getDocs(productCollection);

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    currentGameData = product; // Store globally for purchase functionality
    console.log("🚀 ~ querySnapshot.forEach ~ product:", product);

    // Update page title and breadcrumb
    const pageTitle = document.getElementById('page-title');
    const breadcrumbGame = document.getElementById('breadcrumb-game');
    if (pageTitle) pageTitle.textContent = product.Name;
    if (breadcrumbGame) breadcrumbGame.textContent = product.Name;

    // Update game details
    const gameNameElement = document.querySelector(".single-product h4");
    gameNameElement.textContent = product.Name;
    const priceElement = document.querySelector(".price");

    const oldPriceElement = priceElement.querySelector("em");

    oldPriceElement.textContent = product.Price;

    oldPriceElement.nextSibling.nodeValue = ` $${product.salePrice}`;
    const gameDescElement = document.querySelector(".single-product p");
    gameDescElement.textContent = product.Description;
    const gameImageElement = document.querySelector(
      ".single-product .left-image img"
    );

    console.log(
      "🚀 ~ querySnapshot.forEach ~ gameImageElement:",
      gameImageElement
    );
    gameImageElement.src = product.thumbnail;
  });
}

// Call the function to display products
if (gameName) {
  getProductDetail();
}

// Setup purchase button functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('Product detail page loaded');

  // Check for auth manager with improved retry logic
  function checkAuthManager() {
    console.log('🔍 Checking for authentication manager...');

    const isAuthManagerReady = () => {
      return window.authManager &&
        typeof window.authManager === 'object' &&
        typeof window.authManager.handlePurchase === 'function';
    };

    console.log('Auth manager status:', {
      exists: !!window.authManager,
      type: typeof window.authManager,
      hasHandlePurchase: window.authManager && typeof window.authManager.handlePurchase === 'function'
    });

    if (isAuthManagerReady()) {
      console.log('✅ Auth manager ready immediately');
      setupPurchaseButton();
      return;
    }

    console.log('⏳ Auth manager not ready, starting retry sequence...');

    let retryCount = 0;
    const maxRetries = 3;
    const retryInterval = 1000; // 1 second between retries

    const retryCheck = () => {
      retryCount++;
      console.log(`🔄 Retry ${retryCount}/${maxRetries}: Checking auth manager...`);

      if (isAuthManagerReady()) {
        console.log(`✅ Auth manager ready after ${retryCount} retries`);
        setupPurchaseButton();
        return;
      }

      if (retryCount >= maxRetries) {
        console.error('❌ Auth manager not available after maximum retries');
        console.log('Final auth manager state:', {
          windowAuthManager: window.authManager,
          type: typeof window.authManager,
          methods: window.authManager ? Object.getOwnPropertyNames(window.authManager) : 'N/A'
        });

        // Setup with force flag to show better error messages
        setupPurchaseButton(true);
        return;
      }

      // Continue retrying
      setTimeout(retryCheck, retryInterval);
    };

    // Start first retry after a short delay
    setTimeout(retryCheck, retryInterval);
  }

  // Function to setup purchase button event handler
  function setupPurchaseButton(forceSetup = false) {
    console.log('Setting up purchase button event handler...');

    // Find the purchase form and button
    const purchaseForm = document.getElementById('qty');
    const purchaseButton = purchaseForm?.querySelector('button[type="submit"]');

    console.log('Purchase form found:', !!purchaseForm);
    console.log('Purchase button found:', !!purchaseButton);

    if (!purchaseForm || !purchaseButton) {
      console.error('Purchase form or button not found in DOM');
      return;
    }

    // Remove any existing event listeners by cloning the form
    const newForm = purchaseForm.cloneNode(true);
    purchaseForm.parentNode.replaceChild(newForm, purchaseForm);

    // Add new event listener to the cloned form
    newForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      console.log('🛒 Purchase button clicked!');

      try {
        // Validate game data is loaded
        if (!currentGameData) {
          console.error('No game data available');
          alert('Game information not loaded. Please refresh the page and try again.');
          return;
        }

        // Get quantity from the input field - use getElementById for numeric ID
        const quantityInput = document.getElementById('1') ||
          newForm.querySelector('input[type="qty"]') ||
          newForm.querySelector('input[class="form-control"]') ||
          newForm.querySelector('input[aria-describedby="quantity"]') ||
          newForm.querySelector('input');

        const quantity = parseInt(quantityInput?.value) || 1;

        console.log('Quantity input found:', !!quantityInput);
        console.log('Quantity input value:', quantityInput?.value);
        console.log('Parsed quantity:', quantity);

        console.log('Purchase details:', {
          game: currentGameData.Name,
          quantity: quantity,
          price: currentGameData.salePrice
        });

        // Check auth manager availability
        if (!window.authManager) {
          console.error('Authentication system not available');
          if (forceSetup) {
            alert('Authentication system failed to load. Please refresh the page.');
          } else {
            alert('Please wait for the page to fully load and try again.');
          }
          return;
        }

        // Verify handlePurchase method exists
        if (typeof window.authManager.handlePurchase !== 'function') {
          console.error('Purchase method not available on auth manager');
          console.log('Available methods:', Object.getOwnPropertyNames(window.authManager));
          alert('Purchase functionality is not available. Please refresh the page.');
          return;
        }

        // Disable button to prevent double-clicks
        const submitButton = newForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        try {
          console.log('Calling handlePurchase with:', { gameData: currentGameData, quantity });

          // Call the auth manager's purchase handler
          const result = await window.authManager.handlePurchase(currentGameData, quantity);

          alert('Purchase completed successfully:', result);

        } catch (purchaseError) {
          console.error('Purchase failed:', purchaseError);

          // Show user-friendly error message
          let errorMessage = 'Purchase failed. ';
          if (purchaseError.message) {
            errorMessage += purchaseError.message;
          } else {
            errorMessage += 'Please try again or contact support.';
          }
          alert(errorMessage);

        } finally {
          // Re-enable button
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }

      } catch (error) {
        console.error('Unexpected error during purchase:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    });

    console.log('✅ Purchase button event listener successfully attached');
  }

  checkAuthManager();
});
