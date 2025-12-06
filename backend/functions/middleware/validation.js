// backend/functions/middleware/validation.js
const Joi = require('joi');
const logger = require("firebase-functions/logger");

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    logger.warn("Request validation failed:", { errors: error.details, body: req.body });
    return res.status(400).json({ message: "Bad Request", errors: error.details.map(d => d.message) });
  }
  next();
};

module.exports = {
  validateRequest,
  Joi,
};
