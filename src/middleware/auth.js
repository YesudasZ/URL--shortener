const ensureAuthenticated = (req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized: Please log in to access this resource.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error: Unable to verify authentication.' });
    }
};

module.exports = {
    ensureAuthenticated,
};
