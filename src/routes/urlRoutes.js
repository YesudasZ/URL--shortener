const express = require('express');
const {
    createShortUrl,
    redirectUrl,
    getUrlAnalytics,
    getTopicAnalytics,
    getOverallAnalytics
} = require('../controllers/urlController');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.post('/shorten', ensureAuthenticated, createShortUrl);
router.get('/shorten/:alias', redirectUrl);
router.get('/analytics/:alias',ensureAuthenticated, getUrlAnalytics);
router.get('/analytics/topic/:topic',ensureAuthenticated,  getTopicAnalytics);
router.get('/analytics/overall', ensureAuthenticated, getOverallAnalytics);
module.exports = router;
