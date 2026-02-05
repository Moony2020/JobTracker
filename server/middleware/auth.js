const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || 
                  req.header("Authorization")?.replace("Bearer ", "") || 
                  req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Token is not valid",
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Silently handle invalid tokens to reduce terminal noise
    res.status(401).json({
      message: "Token is not valid",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Access denied: Admin privileges required",
    });
  }
};

auth.adminOnly = adminOnly;
module.exports = auth;
