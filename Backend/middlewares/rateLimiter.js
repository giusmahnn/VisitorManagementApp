const rateLimit = require('express-rate-limit');

// 1. Strict Limiter for Public Public Facing Forms (Registration & Scanning)
// Prevents bots from flooding the database with fake accounts or spamming Resend emails
exports.registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes time window
    max: 10, // Limit each IP address to 10 registration requests per windowMs
    message: {
        success: false,
        message: "Too many registration attempts from this device. Please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Standard Limiter for general Dashboard API routes (Search & Reports)
// Prevents a user from aggressively clicking search bars and slowing down database queries
exports.generalApiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 60, // Limit each IP to 60 requests per minute
    message: {
        success: false,
        message: "Slow down! Too many requests detected from your device."
    },
    standardHeaders: true,
    legacyHeaders: false,
});
