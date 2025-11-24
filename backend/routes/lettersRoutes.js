const express = require('express');
const router = express.Router();
const { sendOfferLetter } = require('../controllers/letterController');

// POST /api/documents/send-offer-letter
router.post('/send-offer-letter', sendOfferLetter);

module.exports = router;
