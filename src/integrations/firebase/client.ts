import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCvxNQn7qMktO6DDg5aOcvRC3ZdjpPH3Pc",
  authDomain: "spotcity-c1148.firebaseapp.com",
  projectId: "spotcity-c1148",
  storageBucket: "spotcity-c1148.firebasestorage.app",
  messagingSenderId: "406873139989",
  appId: "1:406873139989:web:edd4f94e38014e49d2571c",
  measurementId: "G-TX1XQCM7S7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
