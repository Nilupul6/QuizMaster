import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, serverTimestamp, ref, set, push, onValue, remove, update, off } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyC5OFzQp7iqEVNk5-bhzaVHrE9XJG0lqmc",
  authDomain: "quiz-88904.firebaseapp.com",
  databaseURL: "https://quiz-88904-default-rtdb.firebaseio.com",
  projectId: "quiz-88904",
  storageBucket: "quiz-88904.firebasestorage.app",
  messagingSenderId: "515829581367",
  appId: "1:515829581367:web:0768635ef4a36011dc21b2",
  measurementId: "G-GBC4JKP53X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export const timestamp = serverTimestamp; // For Firestore-compatible timestamps



export { ref, set, push, onValue, remove, update, serverTimestamp, off, createUserWithEmailAndPassword };