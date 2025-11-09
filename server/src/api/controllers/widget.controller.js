const db = require('../../../models');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// Issue a short-lived widget token for a given widgetKey and origin
exports.issueToken = async (req, res) => {
  try {
    const { widgetKey, origin } = req.body || {};
    if (!widgetKey) return res.status(400).json({ message: 'widgetKey required' });

    const website = await db.Website.findOne({ where: { widgetKey } });
    if (!website) return res.status(404).json({ message: 'Invalid widgetKey' });

    // optional origin check: if provided, ensure hostname matches website.url
    if (origin && website.url) {
      try {
        const originHost = new URL(origin).hostname;
        const siteHost = new URL(website.url).hostname;
        if (originHost !== siteHost) {
          logger.warn(`[Widget Token] Origin not allowed for widgetKey=${widgetKey} origin=${origin} expected=${website.url}`);
          return res.status(403).json({ message: 'Origin not allowed for this widgetKey' });
        }
      } catch (e) {
        // ignore URL parse errors, but log for debugging
        logger.warn(`[Widget Token] Failed to parse origin/site url during token issue: ${e && e.message}`);
      }
    }

    const payload = {
      websiteId: website.id,
      widgetKey: website.widgetKey,
      type: 'widget'
    };

    const secret = process.env.JWT_SECRET || 'prochat-rahasia';
    const token = jwt.sign(payload, secret, { expiresIn: '10m' });

    res.status(200).json({ token, expiresIn: 600 });
    } catch (error) {
    logger.error('issueToken error ' + (error && (error.stack || error.message || error)));
    res.status(500).json({ message: 'Server error issuing token' });
  }
};
