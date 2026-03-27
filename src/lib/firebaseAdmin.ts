import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../firebase-service-account.json');

if (!admin.apps.length) {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized with service account.');
  } else {
    // Fallback for development if file is missing, using default credentials 
    // or if we want to fail fast. 
    console.warn('WARNING: firebase-service-account.json not found. Firebase will not be initialized correctly.');
    // In a real cloud environment, this would use default credentials
    admin.initializeApp();
  }
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export default admin;
