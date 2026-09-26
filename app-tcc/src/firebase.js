// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEVXmkbkqelO8HY3m5VC3ooGG1YzxhVd4",
  authDomain: "islibrasfood.firebaseapp.com",
  projectId: "islibrasfood",
  storageBucket: "islibrasfood.firebasestorage.app",
  messagingSenderId: "458932014101",
  appId: "1:458932014101:web:82b113ecbac0f20844921c",
  measurementId: "G-14VCQCR0JH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };