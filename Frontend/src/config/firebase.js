import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBU4jl_uDC3yYps9Ijo0BK5fv0DnYeMmU8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jobgenie---an-interview-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jobgenie---an-interview-ai",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166590211912:web:d08bf35716a42a09bfb57d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();