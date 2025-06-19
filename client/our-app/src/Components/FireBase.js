// FireBase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// הגדרות Firebase שלך
const firebaseConfig = {
  apiKey: "AIzaSyBv_jLZfSBwTFbCN1E7OAoQ4-cSJv3MLqk",
  authDomain: "finalprojectandroid2-53c3d.firebaseapp.com",
  databaseURL: "https://finalprojectandroid2-53c3d-default-rtdb.firebaseio.com",
  projectId: "finalprojectandroid2-53c3d",
  storageBucket: "finalprojectandroid2-53c3d.appspot.com",
  messagingSenderId: "21625310037",
  appId: "1:21625310037:web:19fbdf0b3a69ab1b3cfddc",
  measurementId: "G-6Z2XTVC211",
};

// אתחול אפליקציית Firebase
const app = initializeApp(firebaseConfig);

// שימוש בשירותים שונים של Firebase
const auth = getAuth(app);
const database = getDatabase(app);        // Realtime Database
const db = getFirestore(app);             // Firestore Database (לא חובה אם אתה לא משתמש בו)
const storage = getStorage(app);          // Firebase Storage

// ייצוא לשימוש באפליקציה
export { auth, database, db, storage };
