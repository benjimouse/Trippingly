// functions/index.js
// These are the imports that ESLint is complaining about not being used.
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// We need express and cors for our web backend.
const express = require("express");
const cors = require("cors"); // Needed for web apps to talk to functions

// Initialize your Express app.
// This is the 'app' from your original backend/index.js.
const app = express();

// Enable CORS for all origins in development.
// IMPORTANT:
// For production,
// you should restrict this to your frontend's domain for security.
app.use(cors({origin: true}));

// Define your Express routes.
// This is your basic API endpoint.
app.get("/", (req, res) => {
  // Use the 'logger' here to avoid the 'not used' error
  logger.info("Hello from the Trippingly backend function!",
      {structuredData: true});
  res.send("Hello from the Trippingly backend function deployed to Firebase!");
});

// Expose the Express app as a Cloud Function.
// This is where 'onRequest' is actually used to wrap your Express app.
// The name 'api' is what Firebase will use for the function name and its URL.
exports.api = onRequest(app);
