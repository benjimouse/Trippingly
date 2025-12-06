const express = require('express');
const router = express.Router();

const speechesRouter = require('./speeches');
const associationsRouter = require('./associations');

router.use(speechesRouter);
router.use(associationsRouter);

module.exports = router;
