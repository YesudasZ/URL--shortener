const mongoose = require('mongoose');
const shortid = require('shortid');

const RedirectLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    ip: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    osType: {
        type: String,
    },
    deviceType: {
        type: String,
    },
});

const UrlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true,
    },
    shortUrl: {
        type: String,
        unique: true,
        default: () => shortid.generate(),
    },
    customAlias: {
        type: String,
        unique: true,
        sparse: true,
    },
    userId: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        default: 'general',
    },
    clicks: {
        type: Number,
        default: 0,
    },
    redirectLogs: [RedirectLogSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Url', UrlSchema);
