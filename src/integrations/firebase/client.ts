// Firebase client initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDy_l7E1AAPeLwziqp-dvXHjKSDxtnak9Q",
  authDomain: "smartshopai-d5fd8.firebaseapp.com",
  projectId: "smartshopai-d5fd8",
  storageBucket: "smartshopai-d5fd8.firebasestorage.app",
  messagingSenderId: "948889006705",
  appId: "1:948889006705:web:efa0eaddf1dfa7db5761d0",
  measurementId: "G-C7D2NTXG5C",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Configure Google Provider with custom parameters
export const firebaseGoogleProvider = new GoogleAuthProvider();
firebaseGoogleProvider.addScope('email');
firebaseGoogleProvider.addScope('profile');
firebaseGoogleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
