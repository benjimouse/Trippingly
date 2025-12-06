const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const { initializeDb } = require("./db");
const routes = require("./routes");
const { authenticate } = require("./middleware/auth");

initializeDb();

const app = express();

// Whitelist of allowed origins
const allowedOrigins = [
  "https://trippingly-on-the-tongue.web.app",
  "http://localhost:5000",
  // Add any other domains you want to whitelist
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Authentication Middleware ---
app.use(authenticate);

// --- API Endpoints ---
app.use("/", routes);

// Expose the Express app as a Cloud Function
exports.api = onRequest(app);
