import { db } from "./config";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

// Collection reference
const etfsRef = collection(db, "etfs");

// Get all ETFs
export const getETFs = async () => {
  try {
    const snapshot = await getDocs(etfsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting ETFs: ", error);
    throw error;
  }
};

// Add new ETF
export const addETF = async (etfData) => {
  try {
    const docRef = await addDoc(etfsRef, etfData);
    return {
      id: docRef.id,
      ...etfData,
    };
  } catch (error) {
    console.error("Error adding ETF: ", error);
    throw error;
  }
};

// Update ETF
export const updateETF = async (id, etfData) => {
  try {
    const etfRef = doc(db, "etfs", id);
    await updateDoc(etfRef, etfData);
    return {
      id,
      ...etfData,
    };
  } catch (error) {
    console.error("Error updating ETF: ", error);
    throw error;
  }
};

// Get ETFs by group
export const getETFsByGroup = async (group) => {
  try {
    const q = query(etfsRef, where("group", "==", group));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting ETFs by group: ", error);
    throw error;
  }
};
