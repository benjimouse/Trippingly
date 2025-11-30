import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'; // NEW IMPORT

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // NEW EXPORT

// Connect to emulators in development
// Use VITE_USE_FIREBASE_EMULATORS=true in your .env.local to enable
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  console.log("Connecting to local Firebase emulators.");
  try {
    connectAuthEmulator(auth, import.meta.env.VITE_AUTH_EMULATOR_URL || 'http://localhost:9099');
    connectFirestoreEmulator(
      db,
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost',
      Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080)
    );
    connectFunctionsEmulator(
      functions,
      import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST || 'localhost',
      Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT || 5001)
    );
    console.log("Frontend connected to Firebase emulators successfully.");
  } catch (error) {
    console.error("Failed to connect to Firebase emulators:", error);
  }
}

// NOTE: For Cloud Functions, ensure VITE_CLOUD_FUNCTION_URL is set in your .env.local
//       e.g., VITE_CLOUD_FUNCTION_URL="http://localhost:5001/<PROJECT_ID>/us-central1/api"