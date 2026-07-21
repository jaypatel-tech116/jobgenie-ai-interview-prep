const admin = require("firebase-admin");

// TODO(jay): base64-encode your real serviceAccountKey.json and put it in .env as FIREBASE_SERVICE_ACCOUNT_BASE64
//   Linux/macOS: base64 -w0 src/config/serviceAccountKey.json
//   Windows (PowerShell): [Convert]::ToBase64String([IO.File]::ReadAllBytes("src\config\serviceAccountKey.json"))

if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_BASE64 is not defined — see Backend/.env.example",
  );
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
    "utf-8",
  ),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;