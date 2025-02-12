import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  // your existing config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Disable persistence and use memory-only mode
const settings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  cacheSizeBytes: 0, // Disable cache
};

// @ts-ignore
db.settings(settings);

export { db };
