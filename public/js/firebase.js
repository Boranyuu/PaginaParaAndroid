// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJ3aFHGtmDdD4GnRjhUylG2ODYEbaxIRk",
  authDomain: "database-android-a30f4.firebaseapp.com",
  projectId: "database-android-a30f4",
  storageBucket: "database-android-a30f4.appspot.com",
  messagingSenderId: "1005007535919",
  appId: "1:1005007535919:web:c7cc8acb2f8bd37328ebda",
  measurementId: "G-8VCXQKB5FE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
