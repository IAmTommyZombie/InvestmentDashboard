import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase config object from the Firebase Console
  apiKey: "AIzaSyCBZLT3rgxVorNPu5iKdGDV4QL1JBKidZA",
  authDomain: "investment-dashboard-77e78.firebaseapp.com",
  projectId: "investment-dashboard-77e78",
  storageBucket: "investment-dashboard-77e78.firebasestorage.app",
  messagingSenderId: "412792088409",
  appId: "1:412792088409:web:cf4317d151df3211d64e48",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
