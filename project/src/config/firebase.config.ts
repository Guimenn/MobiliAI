import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App;

export function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // Verificar se temos as credenciais necessárias
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      // Usar service account (recomendado para produção)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // Fallback: usar variáveis de ambiente do Firebase (para desenvolvimento)
      // Isso funciona se você exportar as credenciais do Firebase Console
      try {
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'mobiliai',
        });
      } catch (error) {
        console.warn('Firebase Admin não configurado. Login com Google não estará disponível.');
        console.warn('Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env');
      }
    }
  } else {
    firebaseApp = admin.app();
  }

  return firebaseApp;
}

export function getFirebaseAdmin() {
  if (!firebaseApp) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

