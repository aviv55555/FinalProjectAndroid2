import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);       
const db = getFirestore(app);            
const storage = getStorage(app);          

export { auth, database, db, storage };
