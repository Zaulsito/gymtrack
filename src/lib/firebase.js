import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBOWRMMwRva1bbm3KmWRtqXjdav3VewgWE',
  authDomain: 'gym-track-d264b.firebaseapp.com',
  projectId: 'gym-track-d264b',
  storageBucket: 'gym-track-d264b.firebasestorage.app',
  messagingSenderId: '798440975710',
  appId: '1:798440975710:web:e9568554be4cf0289d33cf',
}

export const app  = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)
