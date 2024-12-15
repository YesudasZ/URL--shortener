const Url = require('../models/Url');
const redisClient = require('../config/redis');
const validator = require('validator');
const uaParser = require('ua-parser-js');
const moment = require('moment');

const createShortUrl = async (req, res) => {
    const { longUrl, customAlias, topic } = req.body;
    try {
        if (!validator.isURL(longUrl)) {
            return res.status(400).json({ error: 'Invalid URL format.' });
        }
        if (customAlias) {
            const aliasExists = await Url.findOne({ customAlias });
            if (aliasExists) {
                return res.status(400).json({ error: 'Custom alias already in use.' });
            }
        }
        const shortUrlData = new Url({
            longUrl,
            customAlias,
            topic,
            userId: req.user.id,
        });
        await shortUrlData.save();
        res.status(201).json({
            shortUrl: shortUrlData.customAlias || shortUrlData.shortUrl,
            longUrl,
            topic,
            createdAt: shortUrlData.createdAt,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const redirectUrl = async (req, res) => {
    try {
        const { alias } = req.params;
        const cachedUrl = await redisClient.get(alias);
        if (cachedUrl) {
            console.log(`Cache hit for alias: ${alias}`);
            res.redirect(cachedUrl);
            return;
        }
        const urlData = await Url.findOne({
            $or: [{ shortUrl: alias }, { customAlias: alias }],
        });
        if (!urlData) {
            return res.status(404).json({ error: 'Short URL not found.' });
        }
        await redisClient.set(alias, urlData.longUrl, {
            EX: 3600,
        });
        console.log(`Cache miss. Setting cache for alias: ${alias}`);
        const ua = uaParser(req.headers['user-agent']);
        const log = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            osType: ua.os.name || 'Unknown',
            deviceType: ua.device.type || 'Desktop',
        };
        urlData.redirectLogs.push(log);
        urlData.clicks++;
        await urlData.save();
        res.redirect(urlData.longUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getUrlAnalytics = async (req, res) => {
    try {
        const { alias } = req.params;
        const cachedAnalytics = await redisClient.get(`analytics:${alias}`);
        if (cachedAnalytics) {
            console.log(`Cache hit for analytics: ${alias}`);
            return res.json(JSON.parse(cachedAnalytics));
        }
        const urlData = await Url.findOne({
            $or: [{ shortUrl: alias }, { customAlias: alias }],
        });
        if (!urlData) {
            return res.status(404).json({ error: 'Short URL not found.' });
        }
        const totalClicks = urlData.clicks;
        const uniqueClicks = new Set(urlData.redirectLogs.map(log => log.ip)).size;
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                count: urlData.redirectLogs.filter(log => {
                    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                    return logDate === date.toISOString().split('T')[0];
                }).length,
            };
        }).reverse();
        const osType = urlData.redirectLogs.reduce((acc, log) => {
            acc[log.osType] = (acc[log.osType] || 0) + 1;
            return acc;
        }, {});
        const osAnalytics = Object.keys(osType).map(os => ({
            osName: os,
            uniqueClicks: osType[os],
        }));
        const deviceType = urlData.redirectLogs.reduce((acc, log) => {
            acc[log.deviceType] = (acc[log.deviceType] || 0) + 1;
            return acc;
        }, {});
        const deviceAnalytics = Object.keys(deviceType).map(device => ({
            deviceName: device,
            uniqueClicks: deviceType[device],
        }));
        const analyticsData = {
            totalClicks,
            uniqueClicks,
            clicksByDate: last7Days,
            osType: osAnalytics,
            deviceType: deviceAnalytics,
        };
        await redisClient.set(`analytics:${alias}`, JSON.stringify(analyticsData), {
            EX: 300,
        });
        console.log(`Cache miss. Setting analytics cache for: ${alias}`);
        res.json(analyticsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


const getTopicAnalytics = async (req, res) => {
    try {
        const { topic } = req.params;
        const urls = await Url.find({ topic });
        if (!urls.length) {
            return res.status(404).json({ error: 'No URLs found under this topic.' });
        }
        const totalClicks = urls.reduce((acc, url) => acc + url.clicks, 0);
        const uniqueClicks = new Set(
            urls.flatMap(url => url.redirectLogs.map(log => log.ip))
        ).size;
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                count: urls.reduce((acc, url) => {
                    return (
                        acc +
                        url.redirectLogs.filter(log => {
                            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                            return logDate === date.toISOString().split('T')[0];
                        }).length
                    );
                }, 0),
            };
        }).reverse();
        const urlAnalytics = urls.map(url => ({
            shortUrl: url.shortUrl,
            totalClicks: url.clicks,
            uniqueClicks: new Set(url.redirectLogs.map(log => log.ip)).size,
        }));
        res.json({
            totalClicks,
            uniqueClicks,
            clicksByDate: last7Days,
            urls: urlAnalytics,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getOverallAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const cachedOverallAnalytics = await redisClient.get(`overallAnalytics:${userId}`);
        if (cachedOverallAnalytics) {
            console.log(`Cache hit for overall analytics: ${userId}`);
            return res.json(JSON.parse(cachedOverallAnalytics));
        }
        const urls = await Url.find({ userId });
        if (!urls.length) {
            return res.status(404).json({ error: 'No URLs found for this user.' });
        }
        const totalUrls = urls.length;
        const totalClicks = urls.reduce((acc, url) => acc + url.clicks, 0);
        const uniqueClicks = new Set(
            urls.flatMap(url => url.redirectLogs.map(log => log.ip))
        ).size;
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
            return {
                date,
                count: urls.reduce((acc, url) => {
                    return (
                        acc +
                        url.redirectLogs.filter(log => {
                            const logDate = moment(log.timestamp).format('YYYY-MM-DD');
                            return logDate === date;
                        }).length
                    );
                }, 0),
            };
        }).reverse();
        const osType = urls.flatMap(url => url.redirectLogs).reduce((acc, log) => {
            acc[log.osType] = acc[log.osType] || { uniqueClicks: 0, uniqueUsers: new Set() };
            acc[log.osType].uniqueClicks++;
            acc[log.osType].uniqueUsers.add(log.ip);
            return acc;
        }, {});
        const osAnalytics = Object.keys(osType).map(os => ({
            osName: os,
            uniqueClicks: osType[os].uniqueClicks,
            uniqueUsers: osType[os].uniqueUsers.size,
        }));
        const deviceType = urls.flatMap(url => url.redirectLogs).reduce((acc, log) => {
            acc[log.deviceType] = acc[log.deviceType] || { uniqueClicks: 0, uniqueUsers: new Set() };
            acc[log.deviceType].uniqueClicks++;
            acc[log.deviceType].uniqueUsers.add(log.ip);
            return acc;
        }, {});
        const deviceAnalytics = Object.keys(deviceType).map(device => ({
            deviceName: device,
            uniqueClicks: deviceType[device].uniqueClicks,
            uniqueUsers: deviceType[device].uniqueUsers.size,
        }));
        const overallAnalyticsData = {
            totalUrls,
            totalClicks,
            uniqueClicks,
            clicksByDate: last7Days,
            osType: osAnalytics,
            deviceType: deviceAnalytics,
        };
        await redisClient.set(`overallAnalytics:${userId}`, JSON.stringify(overallAnalyticsData), {
            EX: 300,
        });
        console.log(`Cache miss. Setting overall analytics cache for: ${userId}`);
        res.json(overallAnalyticsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createShortUrl,
    redirectUrl,
    getUrlAnalytics,
    getTopicAnalytics,
    getOverallAnalytics
};


