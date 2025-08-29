// functions/index.js
const {
  onRequest,
} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");

// Import Firebase Admin SDK for server-side operations
const admin = require("firebase-admin").default;
logger.info("DEBUG: Admin object keys (after require):", Object.keys(admin || {})); // DEBUG 1
admin.initializeApp(); // Initialize Admin SDK
logger.info("DEBUG: Admin object keys (after initializeApp):", Object.keys(admin || {})); // DEBUG 2


// Get Firestore instance
const db = admin.firestore();
logger.info("DEBUG: Firestore DB instance keys (after admin.firestore()):", Object.keys(db || {})); // DEBUG 3
const FieldValue = admin.firestore.FieldValue;
logger.info("DEBUG: FieldValue constant:", FieldValue); // DEBUG 4


const app = express();

// Enable CORS for all origins in development.
// IMPORTANT: For production, restrict this to your frontend's domain(s).
app.use(cors({
  origin: true,
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Authentication Middleware ---
// This function will check if the user is authenticated via their ID token
const authenticate = async (req, res, next) => {
  // Check for Authorization header
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    logger.warn("Unauthorized access: No Authorization header or malformed token.");
    return res.status(401).send("Unauthorized");
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Attach the decoded token (which contains user UID) to the request
    req.user = decodedToken;
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    logger.error("Error verifying ID token:", error);
    // Respond with 401 if token is invalid or expired
    return res.status(401).send("Unauthorized: Invalid or expired token.");
  }
};

// --- API Endpoints ---
// Save emoji association and clean speech text for a speech
app.post("/saveEmojiAssociation", authenticate, async (req, res) => {
  const userId = req.user.uid;
  const { speechId, originalText, emoji, position, cleanSpeech } = req.body;

  if (!speechId || typeof speechId !== "string") {
    logger.warn("Missing or invalid speechId in emoji association.");
    return res.status(400).send("speechId is required.");
  }
  if (!originalText || typeof originalText !== "string") {
    logger.warn("Missing or invalid originalText in emoji association.");
    return res.status(400).send("originalText is required.");
  }
  if (!emoji || typeof emoji !== "string") {
    logger.warn("Missing or invalid emoji in emoji association.");
    return res.status(400).send("emoji is required.");
  }
  if (typeof position !== "number") {
    logger.warn("Missing or invalid position in emoji association.");
    return res.status(400).send("position is required.");
  }
  if (!cleanSpeech || typeof cleanSpeech !== "string") {
    logger.warn("Missing or invalid cleanSpeech in emoji association.");
    return res.status(400).send("cleanSpeech is required.");
  }

  try {
    // Reference to the speech document
    const speechRef = db.collection("users").doc(userId).collection("speeches").doc(speechId);
    // Save association in a subcollection 'emojiAssociations'
    await speechRef.collection("emojiAssociations").add({
      originalText,
      emoji,
      position,
      createdAt: FieldValue.serverTimestamp(),
    });
    // Optionally, preserve the clean speech text in the main document
    await speechRef.set({ cleanSpeech }, { merge: true });
    logger.info(`Saved emoji association for speech ${speechId} by user ${userId}`);
    res.status(200).json({ message: "Emoji association saved successfully." });
  } catch (error) {
    logger.error("Error saving emoji association:", error);
    res.status(500).send("Failed to save emoji association.");
  }
});

// Root endpoint (your existing backend message)
app.get("/", (req, res) => {
  logger.info("Hello from the Trippingly backend function!", {
    structuredData: true,
  });
  res.send("Hello from the Trippingly backend function deployed to Firebase!");
});

// New endpoint to upload and store a speech
app.post("/uploadSpeech", authenticate, async (req, res) => {
  // req.user is populated by the 'authenticate' middleware
  const userId = req.user.uid;
  const {
    speechName,
    fileContent,
  } = req.body; // Expecting JSON with these fields

  logger.info(`Upload request for user: ${userId}, Speech Name: ${speechName}`, {
    structuredData: true,
  });

  // --- Server-side Validation ---
  if (!speechName || typeof speechName !== "string" || speechName.trim() === "") {
    logger.warn("Bad request: Missing or invalid speechName.");
    return res.status(400).send("Speech name is required.");
  }
  if (!fileContent || typeof fileContent !== "string" || fileContent.trim() === "") {
    logger.warn("Bad request: Missing or empty fileContent for speech:", speechName);
    return res.status(400).send("Speech content cannot be empty.");
  }

  try {
    // Store the speech in Firestore
    // Path: users/{userId}/speeches/{autoGeneratedSpeechId}
    const speechRef = await db.collection("users").doc(userId).collection("speeches").add({
      name: speechName,
      content: fileContent,
      userId: userId, // Redundant but good for quick queries
      createdAt: FieldValue.serverTimestamp(), // Use the constant you defined
      updatedAt: FieldValue.serverTimestamp(), // Use the constant you defined
    });

    logger.info(`Speech "'${speechName}'" uploaded by ${userId} with ID: ${speechRef.id}`, {
      structuredData: true,
    });
    res.status(200).json({
      message: `Speech "'${speechName}'" uploaded successfully!`,
      speechId: speechRef.id,
    });
  } catch (error) {
    logger.error("Error uploading speech to Firestore:", error);
    res.status(500).send("Failed to upload speech. Please try again.");
  }
});

app.get("/getSpeeches", authenticate, async (req, res) => {
  const userId = req.user.uid;
  logger.info(`Fetching speeches for user: ${userId}`, {structuredData: true});

  try {
    // Get a reference to the user's speeches subcollection
    const speechesRef = db.collection("users").doc(userId).collection("speeches");

    // Fetch documents, ordered by creation time (newest first)
    const snapshot = await speechesRef.orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      logger.info(`No speeches found for user: ${userId}`);
      return res.status(200).json({message: "No speeches found.", speeches: []});
    }

    // Map documents to an array of speech objects
    const speeches = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      speeches.push({
        id: doc.id,
        name: data.name,
        // You might want to truncate content if displaying a list,
        // or only fetch content when the user views the full speech.
        // For now, let's include full content for simplicity, but be mindful of data size.
        content: data.content,
        createdAt: data.createdAt ? data.createdAt.toDate() : null, // Convert Firestore Timestamp to JS Date
      });
    });

    logger.info(`Found ${speeches.length} speeches for user: ${userId}`);
    res.status(200).json({message: "Speeches fetched successfully.", speeches: speeches});
  } catch (error) {
    logger.error("Error fetching speeches from Firestore:", error);
    res.status(500).send("Failed to fetch speeches. Please try again.");
  }
});

app.get('/getSpeech/:speechId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const speechId = req.params.speechId; // Get speechId from URL parameters
    logger.info(`Fetching speech ${speechId} for user: ${userId}`, { structuredData: true });

    try {
        // Get a reference to the specific speech document
        const speechDocRef = db.collection('users').doc(userId).collection('speeches').doc(speechId);
        const speechDoc = await speechDocRef.get();

        if (!speechDoc.exists) {
            logger.info(`Speech ${speechId} not found for user ${userId}`);
            return res.status(404).json({ message: 'Speech not found.' });
        }

        const speechData = speechDoc.data();

        // IMPORTANT: Ensure the retrieved speech belongs to the authenticated user.
        // This is already implicitly handled by the path db.collection('users').doc(userId),
        // but explicitly checking userId from doc.data() is a good sanity check
        // if you ever change your data model. For now, it's redundant but safe.
        if (speechData.userId && speechData.userId !== userId) {
             logger.warn(`User ${userId} attempted to access speech ${speechId} belonging to ${speechData.userId}`);
             return res.status(403).json({ message: 'Access denied.' });
        }

        logger.info(`Successfully fetched speech ${speechId} for user ${userId}`);
        res.status(200).json({
            id: speechDoc.id,
            name: speechData.name,
            content: speechData.content,
            createdAt: speechData.createdAt ? speechData.createdAt.toDate() : null // Convert Timestamp to JS Date
        });

    } catch (error) {
        logger.error(`Error fetching speech ${speechId} for user ${userId}:`, error);
        res.status(500).send('Failed to fetch speech details. Please try again.');
    }
});

app.delete('/deleteSpeech/:speechId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const speechId = req.params.speechId;
    logger.info(`Deleting speech ${speechId} for user: ${userId}`, { structuredData: true });

    try {
        const speechDocRef = db.collection('users').doc(userId).collection('speeches').doc(speechId);
        await speechDocRef.delete();

        logger.info(`Successfully deleted speech ${speechId} for user ${userId}`);
        res.status(200).json({ message: 'Speech deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting speech ${speechId} for user ${userId}:`, error);
        res.status(500).send('Failed to delete speech. Please try again.');
    }
});

// Expose the Express app as a Cloud Function
exports.api = onRequest(app);