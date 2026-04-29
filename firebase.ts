import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config from the exported project
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0161444383',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:36026978160:web:2f4c4304f2c432831709b5',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyADNV782_uqrJQ1RPRWHkCF8WXk1anvvl8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0161444383.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0161444383.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '36026978160',
};

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DB ||
  'ai-studio-df04afca-3342-40d0-a21b-fdbd6a6ca6cf';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
