// Firebase Configuration
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
// Support both JSON file (local development) and environment variables (Vercel)
let app;
let db;

try {
  // Try to use JSON credentials file first (local development)
  const serviceAccountPath = path.join(__dirname, '..', '..', 'americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔧 Using Firebase JSON credentials file (local development)');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    // Use the 'americanbox' database
    db = getFirestore(app, 'americanbox');
  } else {
    // Fall back to environment variables (Vercel production)
    console.log('🔧 Using Firebase environment variables (Vercel production)');

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    // Use the 'americanbox' database
    db = getFirestore(app, 'americanbox');
  }

  console.log('✅ Firebase initialized successfully');

} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  throw error;
}

module.exports = { app, db };