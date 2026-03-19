const nodemailer = require('nodemailer');

/**
 * Centralized Mail Transporter Configuration
 * Switches to Port 587 (STARTTLS) for better production compatibility
 */
const createTransporter = () => {
    const mailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'false' ? false : true, // Default to true for 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Verbose logging for debugging on Render
        logger: true,
        debug: true,
        // Explicit timeouts
        connectionTimeout: 10000, // 10s
        greetingTimeout: 10000,   // 10s
        socketTimeout: 30000,     // 30s
        tls: {
            rejectUnauthorized: false
        }
    };

    return nodemailer.createTransport(mailConfig);
};

const sendMail = async (options) => {
    const transporter = createTransporter();
    return await transporter.sendMail(options);
};

module.exports = {
    createTransporter,
    sendMail
};
