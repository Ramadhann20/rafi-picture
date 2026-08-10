import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function createAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID is missing.");
  }

  if (!clientEmail) {
    throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL is missing.");
  }

  if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is missing.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const adminApp = getApps().length ? getApps()[0] : createAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;
