const express = require('express');
const router = express.Router();
const { Joi } = require('../middleware/validation');
const { validateRequest } = require('../middleware/validation');
const { getDb } = require('../db');

const uploadSpeechSchema = Joi.object({
  speechName: Joi.string().required().min(1),
  fileContent: Joi.string().required().min(1),
});

router.post("/uploadSpeech", validateRequest(uploadSpeechSchema), async (req, res) => {
  const userId = req.user.uid;
  const { speechName, fileContent } = req.body;
  const db = getDb();

  try {
    const speechRef = await db.collection("users").doc(userId).collection("speeches").add({
      name: speechName,
      content: fileContent,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: `Speech "'${speechName}'" uploaded successfully!`,
      speechId: speechRef.id,
    });
  } catch (error) {
    console.error("Error uploading speech to Firestore:", error);
    res.status(500).send("Failed to upload speech. Please try again.");
  }
});

router.get("/getSpeeches", async (req, res) => {
  const userId = req.user.uid;
  const { limit = 10, lastVisible } = req.query;
  const db = getDb();

  try {
    let query = db.collection("users").doc(userId).collection("speeches")
      .orderBy("createdAt", "desc")
      .limit(Number(limit));

    if (lastVisible) {
      const lastVisibleDoc = await db.collection("users").doc(userId).collection("speeches").doc(lastVisible).get();
      query = query.startAfter(lastVisibleDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: "No more speeches found.", speeches: [], lastVisible: null });
    }

    const speeches = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      speeches.push({
        id: doc.id,
        name: data.name,
        content: data.content,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
      });
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const newLastVisible = lastDoc ? lastDoc.id : null;

    res.status(200).json({ message: "Speeches fetched successfully.", speeches, lastVisible: newLastVisible });
  } catch (error) {
    console.error("Error fetching speeches from Firestore:", error);
    res.status(500).send("Failed to fetch speeches. Please try again.");
  }
});

router.get("/getSpeech/:speechId", async (req, res) => {
  const userId = req.user.uid;
  const speechId = req.params.speechId;
  const db = getDb();

  try {
    const speechDocRef = db.collection("users").doc(userId).collection("speeches").doc(speechId);
    const speechDoc = await speechDocRef.get();

    if (!speechDoc.exists) {
      return res.status(404).json({ message: "Speech not found." });
    }

    const speechData = speechDoc.data();

    if (speechData.userId && speechData.userId !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({
      id: speechDoc.id,
      name: speechData.name,
      content: speechData.content,
      createdAt: speechData.createdAt ? speechData.createdAt.toDate() : null,
    });
  } catch (error) {
    console.error(`Error fetching speech ${speechId} for user ${userId}:`, error);
    res.status(500).send("Failed to fetch speech details. Please try again.");
  }
});

router.delete("/deleteSpeech/:speechId", async (req, res) => {
  const userId = req.user.uid;
  const speechId = req.params.speechId;
  const db = getDb();

  try {
    const speechDocRef = db.collection("users").doc(userId).collection("speeches").doc(speechId);
    await speechDocRef.delete();

    res.status(200).json({ message: "Speech deleted successfully." });
  } catch (error) {
    console.error(`Error deleting speech ${speechId} for user ${userId}:`, error);
    res.status(500).send("Failed to delete speech. Please try again.");
  }
});

module.exports = router;
