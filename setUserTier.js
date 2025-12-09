// One-off script to set a Firebase user's tier using the Admin SDK.
// Usage:
// 1. Download a service account JSON from Firebase Console -> Project Settings -> Service accounts
//    and save it as `service-account.json` in this repo (or set the path below).
// 2. Install dependency: `npm install firebase-admin` (or `npm ci` if you added to package.json).
// 3. Run: `node setUserTier.js <USER_UID> [premium|admin|free]`

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error('Failed to load service account JSON at', SERVICE_ACCOUNT_PATH);
  console.error('Place the downloaded JSON from Firebase Console at that path.');
  console.error(err.message || err);
  process.exit(1);
}

const uid = process.argv[2];
const tier = (process.argv[3] || 'premium').toLowerCase();

if (!uid) {
  console.error('Usage: node setUserTier.js <uid> [premium|admin|free]');
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
