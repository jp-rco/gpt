// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0z92dQiHPxQ4iLix9Uo4vNGo70En_1AQ",
  authDomain: "chatgptjp-495c1.firebaseapp.com",
  projectId: "chatgptjp-495c1",
  storageBucket: "chatgptjp-495c1.firebasestorage.app",
  messagingSenderId: "407794419423",
  appId: "1:407794419423:web:eece60a69df7667c2e8b6a",
  measurementId: "G-JTT4N6GFEX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
