// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Verificación de configuración (solo warnings en build time)
const isConfigComplete = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId

if (!isConfigComplete) {
  console.warn(
    '⚠️ Advertencia: configuración de Firebase incompleta. Verifica las variables de entorno VITE_FIREBASE_* en Vercel.'
  )
  console.warn('La aplicación no funcionará correctamente hasta que se configuren todas las variables.')
}

// Inicializa Firebase solo si la configuración está completa
let firebaseApp
let auth
let fdb

if (isConfigComplete) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  fdb = getFirestore(firebaseApp)
} else {
  // Exportar objetos dummy para evitar errores en build time
  firebaseApp = null as any
  auth = null as any
  fdb = null as any
}

export { firebaseApp, auth, fdb }
