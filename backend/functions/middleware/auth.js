const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

const authenticate = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    logger.warn("Unauthorized access: No Authorization header or malformed token.");
    return res.status(401).send("Unauthorized");
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error("Error verifying ID token:", error);
    return res.status(401).send("Unauthorized: Invalid or expired token.");
  }
};

module.exports = {
  authenticate,
};
