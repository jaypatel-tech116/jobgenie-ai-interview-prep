import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCLx3zaV16tg40CdG9OVbFOMxqODcYWe4I",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "jobgenie-ai-interview.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "jobgenie-ai-interview",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:9652880283:web:c3bde552682ff54511973e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
