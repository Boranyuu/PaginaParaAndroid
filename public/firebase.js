// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJ3aFHGtmDdD4GnRjhUylG2ODYEbaxIRk",
  authDomain: "database-android-a30f4.firebaseapp.com",
  projectId: "database-android-a30f4",
  storageBucket: "database-android-a30f4.firebasestorage.app",
  messagingSenderId: "1005007535919",
  appId: "1:1005007535919:web:c7cc8acb2f8bd37328ebda",
  measurementId: "G-8VCXQKB5FE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);