// backend/functions/middleware/validation.js
const logger = require("firebase-functions/logger");

const validateRequest = (schema) => (req, res, next) => {
  const errors = [];

  for (const key in schema) {
    const rules = schema[key];
    const value = req.body[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required.`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}.`);
      }
      if (rules.type === 'string' && rules.notEmpty && value.trim() === '') {
        errors.push(`${key} cannot be empty.`);
      }
    }
  }

  if (errors.length > 0) {
    logger.warn("Request validation failed:", { errors, body: req.body });
    return res.status(400).json({ message: "Bad Request", errors });
  }

  next();
};

module.exports = {
  validateRequest,
};
