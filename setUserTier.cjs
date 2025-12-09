// One-off script (CommonJS) to set a Firebase user's tier using the Admin SDK.
// Usage:
// 1. Download a service account JSON from Firebase Console -> Project Settings -> Service accounts
//    and save it as `service-account.json` in this repo (or set the path below).
// 2. Install dependency: `npm install firebase-admin`.
// 3. Run: `node setUserTier.cjs <USER_UID> [premium|admin|free]`

const admin = require('firebase-admin');
const path = require('path');

// Allow service account path via env var or a CLI flag so you don't have to
// place the JSON in the repo root. If GOOGLE_APPLICATION_CREDENTIALS is set
// the Admin SDK can use Application Default Credentials.
const DEFAULT_PATH = path.join(__dirname, 'service-account.json');
const cliPathIndex = process.argv.indexOf('--service-account');
const cliPath = cliPathIndex !== -1 ? process.argv[cliPathIndex + 1] : null;
const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SERVICE_ACCOUNT_PATH = cliPath || envPath || DEFAULT_PATH;

try {
  if (envPath && !cliPath) {
    // If user set GOOGLE_APPLICATION_CREDENTIALS, prefer ADC (applicationDefault)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (err) {
  console.error('Failed to initialize Firebase Admin. Tried path:', SERVICE_ACCOUNT_PATH);
  console.error('You can either set the env var GOOGLE_APPLICATION_CREDENTIALS pointing to the JSON,');
  console.error('or pass --service-account /path/to/service-account.json to this script,');
  console.error('or place service-account.json in the repository root.');
  console.error(err.message || err);
  process.exit(1);
}

const uid = process.argv[2];
const tier = (process.argv[3] || 'premium').toLowerCase();

if (!uid) {
  console.error('Usage: node setUserTier.cjs <uid> [premium|admin|free]');
  process.exit(1);
}

if (!['free', 'premium', 'admin'].includes(tier)) {
  console.error('Tier must be one of: free, premium, admin');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { tier })
  .then(() => admin.auth().getUser(uid))
  .then(user => {
    console.log(`Set tier='${tier}' for uid=${uid}`);
    console.log('User customClaims:', user.customClaims);
    console.log('Note: user must refresh their ID token (sign out/in or call getIdToken(true)).');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error setting custom claims:', err);
    process.exit(1);
  });
