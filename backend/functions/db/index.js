const admin = require("firebase-admin");

let db;

function initializeDb() {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    admin.initializeApp({ projectId: "trippingly-on-the-tongue" });
  } else {
    admin.initializeApp();
  }
  db = admin.firestore();
}

function getDb() {
  if (!db) {
    initializeDb();
  }
  return db;
}

module.exports = {
  initializeDb,
  getDb,
};
