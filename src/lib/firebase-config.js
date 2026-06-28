// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQ3aud8Ly4QY_Lm-L4p_HdmedtJumSMQs",
  authDomain: "skripsi-unikom.firebaseapp.com",
  projectId: "skripsi-unikom",
  storageBucket: "skripsi-unikom.firebasestorage.app",
  messagingSenderId: "906990493514",
  appId: "1:906990493514:web:d07c41ee9b0fb59c7d6bb3",
  measurementId: "G-HKFQFDL0CL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app);