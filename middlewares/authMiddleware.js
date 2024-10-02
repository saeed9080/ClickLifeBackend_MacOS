const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    try {
        // Get token from headers
        const token = req.headers.authorization.split(" ")[1];
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "UnAuthorized User"
        });
    }
};

module.exports = authenticateUser;
