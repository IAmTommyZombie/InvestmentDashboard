const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCBZLT3rgxVorNPu5iKdGDV4QL1JBKidZA",
  authDomain: "investment-dashboard-77e78.firebaseapp.com",
  projectId: "investment-dashboard-77e78",
  storageBucket: "investment-dashboard-77e78.firebasestorage.app",
  messagingSenderId: "412792088409",
  appId: "1:412792088409:web:cf4317d151df3211d64e48",
};

async function testFirebaseConnection() {
  console.log("Initializing Firebase...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Attempting to write test data...");
  try {
    const testRef = doc(collection(db, "test"), "test-document");
    await setDoc(testRef, {
      message: "Test successful",
      timestamp: new Date().toISOString(),
    });
    console.log("Successfully wrote to Firebase!");
  } catch (error) {
    console.error("Error writing to Firebase:", error);
  }
}

testFirebaseConnection()
  .then(() => {
    console.log("Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
