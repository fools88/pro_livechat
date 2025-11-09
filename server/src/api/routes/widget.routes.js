const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widget.controller');
const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

// Rate limiter for token issuance: limit to 30 requests per minute per IP
const tokenLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn('[Widget Token] Rate limit exceeded for ' + (req.ip || req.connection.remoteAddress));
		res.status(429).json({ message: 'Too many token requests, try later' });
	}
});

// Public endpoint for widget to request a short-lived token
router.post('/token', tokenLimiter, widgetController.issueToken);

module.exports = router;
