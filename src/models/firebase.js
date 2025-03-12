// src/models/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFjrtXJKR_VM2kTanKczI5IkRD0oHRPSY",
  authDomain: "inventory-mgm.firebaseapp.com",
  databaseURL: "https://inventory-mgm-default-rtdb.firebaseio.com",
  projectId: "inventory-mgm",
  storageBucket: "inventory-mgm.firebasestorage.app",
  messagingSenderId: "842722914750",
  appId: "1:842722914750:web:287d57e6c96ae827c489ef",
  measurementId: "G-6L8K24TRHC"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();
// מגדירים שהחלון יבקש בחירת חשבון בכל פעם
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});
export { db, auth, googleAuthProvider };
