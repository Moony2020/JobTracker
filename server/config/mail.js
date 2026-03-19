const nodemailer = require('nodemailer');

/**
 * Centralized Mail Transporter Configuration
 * Switches to Port 587 (STARTTLS) for better production compatibility
 */
const createTransporter = () => {
    const mailConfig = {
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Adding explicit timeouts
        connectionTimeout: 10000, // 10s
        greetingTimeout: 10000,   // 10s
        socketTimeout: 30000,     // 30s
        tls: {
            // Many cloud providers have intermediate cert issues with STARTTLS
            rejectUnauthorized: false
        }
    };

    // Use service: 'gmail' if it's Gmail - this is often more robust in cloud environments
    if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('gmail.com')) {
        mailConfig.service = 'gmail';
    } else {
        mailConfig.host = process.env.EMAIL_HOST;
        mailConfig.port = parseInt(process.env.EMAIL_PORT) || 587;
        mailConfig.secure = process.env.EMAIL_SECURE === 'true';
    }

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
