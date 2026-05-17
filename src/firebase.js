// ═══════════════════════════════════════════════
// Gary's Life — Firebase Configuration
// ═══════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyASGY7p9nJDHJYauZk_jTJ-Myk8Y29MBzI",
  authDomain: "garys-life.firebaseapp.com",
  projectId: "garys-life",
  storageBucket: "garys-life.firebasestorage.app",
  messagingSenderId: "280394904120",
  appId: "1:280394904120:web:f74fa66177610ef02aaccd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
