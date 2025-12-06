const express = require('express');
const router = express.Router();
const { Joi } = require('../middleware/validation');
const { validateRequest } = require('../middleware/validation');
const { getDb } = require('../db');

const saveEmojiAssociationSchema = Joi.object({
  speechId: Joi.string().required(),
  originalText: Joi.string().required(),
  emoji: Joi.string().required(),
  position: Joi.number().required(),
  cleanSpeech: Joi.string().required(),
  assocId: Joi.string(),
  showOriginal: Joi.boolean(),
});

router.post("/saveEmojiAssociation", validateRequest(saveEmojiAssociationSchema), async (req, res) => {
  const userId = req.user.uid;
  const { speechId, assocId, originalText, emoji, position, cleanSpeech } = req.body;
  const db = getDb();

  try {
    const speechRef = db.collection("users").doc(userId).collection("speeches").doc(speechId);
    const assocData = {
      originalText,
      emoji,
      position,
      showOriginal: req.body.showOriginal === true,
      createdAt: new Date(),
    };
    if (assocId && typeof assocId === "string") {
      await speechRef.collection("emojiAssociations").doc(assocId).set(assocData);
    } else {
      await speechRef.collection("emojiAssociations").add(assocData);
    }
    await speechRef.set({ cleanSpeech }, { merge: true });
    res.status(200).json({ message: "Emoji association saved successfully." });
  } catch (error) {
    console.error("Error saving emoji association:", error);
    res.status(500).send("Failed to save emoji association.");
  }
});

router.post("/updateAssociationToggle", async (req, res) => {
  const userId = req.user.uid;
  const { speechId, assocId, showOriginal } = req.body;
  const db = getDb();

  try {
    const assocRef = db
      .collection("users")
      .doc(userId)
      .collection("speeches")
      .doc(speechId)
      .collection("emojiAssociations")
      .doc(assocId);
    await assocRef.set({ showOriginal }, { merge: true });
    res.status(200).json({ message: "Updated association toggle" });
  } catch (err) {
    console.error("Failed to update association toggle:", err);
    res.status(500).send("Failed to update association toggle");
  }
});

module.exports = router;
