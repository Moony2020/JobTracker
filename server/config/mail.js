const nodemailer = require('nodemailer');

/**
 * Centralized Mail Transporter Configuration
 * Switches to Port 587 (STARTTLS) for better production compatibility
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' ? true : false, // 587 is STARTTLS (secure: false)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const sendMail = async (options) => {
    const transporter = createTransporter();
    return await transporter.sendMail(options);
};

module.exports = {
    createTransporter,
    sendMail
};
