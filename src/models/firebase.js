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

// const firebaseConfig = {
//   apiKey: "AIzaSyD5eqJlBFsjHdi2RYaWm1uEZ2FpAYjHKcQ",
//   authDomain: "investory-mgm-test.firebaseapp.com",
//   databaseURL: "https://investory-mgm-test-default-rtdb.firebaseio.com/",
//   projectId: "investory-mgm-test",
//   storageBucket: "investory-mgm-test.firebasestorage.app",
//   messagingSenderId: "689950267404",
//   appId: "1:689950267404:web:cef2dc4969168ef8a23629",
//   measurementId: "G-KGY45K7WWE"
// };



const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();
// מגדירים שהחלון יבקש בחירת חשבון בכל פעם
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});
export { db, auth, googleAuthProvider };
