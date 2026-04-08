import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyACbx4Fg8mqeGHVfJZNqUcdA3q4PLUrlPQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bykelink-system.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bykelink-system',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bykelink-system.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '977720405292',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:977720405292:web:87eb5f9d21811130759089',
}

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1')
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})
