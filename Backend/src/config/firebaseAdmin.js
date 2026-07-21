const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is missing.",
  );
}

let serviceAccount;

try {
  const decoded = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    "base64",
  ).toString("utf8");

  serviceAccount = JSON.parse(decoded);
} catch (error) {
  throw new Error(
    `Failed to decode Firebase service account credentials: ${error.message}`,
  );
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

const auth = getAuth(app);

module.exports = auth;
