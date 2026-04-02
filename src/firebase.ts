import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJYdKgv9NIcxTSSF_V1im_kcYh0VUIhms",
  authDomain: "blue-door-talent.firebaseapp.com",
  projectId: "blue-door-talent",
  storageBucket: "blue-door-talent.firebasestorage.app",
  messagingSenderId: "295616335712",
  appId: "1:295616335712:web:3152da6298655052cc5805",
  measurementId: "G-BPFN4RXREM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
