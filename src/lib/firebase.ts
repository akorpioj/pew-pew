import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "pew-bab23",
  appId: "1:1085978783517:web:e6587e1404bbf6840b3bf4",
  storageBucket: "pew-bab23.firebasestorage.app",
  apiKey: "AIzaSyAuP4Ijy_npXcewmFT9w0GlUFqV821oX20",
  authDomain: "pew-bab23.firebaseapp.com",
  messagingSenderId: "1085978783517",
  measurementId: "G-NRSJC0CJHP",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
