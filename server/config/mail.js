const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Centralized Mail Transporter Configuration
 * Switches to Port 465 (SMTPS) for SMTP fallback
 */
const createTransporter = () => {
    const mailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'false' ? false : true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Explicit timeouts
        connectionTimeout: 10000, 
        greetingTimeout: 10000,   
        socketTimeout: 30000,     
        tls: {
            rejectUnauthorized: false
        }
    };

    return nodemailer.createTransport(mailConfig);
};

/**
 * Sends email using Resend HTTP API (Production/Render) 
 * or falls back to SMTP (Local Dev).
 */
const sendMail = async (options) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
        try {
            const response = await axios.post('https://api.resend.com/emails', {
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            }, {
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Resend success:', response.data.id);
            return { messageId: response.data.id };
        } catch (error) {
            console.error('❌ Resend Error:', error.response?.data || error.message);
            // Fallback to SMTP if Resend fails? 
            // Better to throw or proceed to SMTP if it's potentially a domain issue
        }
    }

    // Fallback to SMTP
    const transporter = createTransporter();
    return await transporter.sendMail(options);
};

module.exports = {
    createTransporter,
    sendMail
};
