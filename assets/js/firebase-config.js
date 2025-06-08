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
// Initialize Cloud Firestore and get a reference to the service

async function displayProducts() {
  const productCollection = collection(db, "game");
  const querySnapshot = await getDocs(productCollection);

  const wrapper = document.querySelector(".trending .container .row");

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    console.log("🚀 ~ querySnapshot.forEach ~ product:", product)

    // Create a swiper-slide element
    const slide = document.createElement("div");
    slide.classList.add("col-md-6");

    // Add product content to the slide
    slide.innerHTML = `
                  <div class="item">
            <div class="thumb">
              <a href="product-details.html?game=${product.url}"><img src="${product.thumbnail}" alt="" /></a>
             <span class="price"><em>${product.Price}$</em>${product.salePrice
      }$</span>
            </div>
            <div class="down-content">
              <span class="category">${product.category}</span>
              <h4>${product.Name}</h4>
              <a href="product-details.html?game=${product.url}"><i class="fa fa-shopping-bag"></i></a>
            </div>
          </div>
    `;

    // Append the slide to the swiper-wrapper
    wrapper.appendChild(slide);
  });

  // Reinitialize Swiper after adding slides

}

// Call the function to display products
displayProducts();