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
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Try Brevo (Recommended for Domain-less Sending)
    if (brevoApiKey) {
        try {
            const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER },
                to: [{ email: options.to }],
                subject: options.subject,
                htmlContent: options.html,
                textContent: options.text
            }, {
                headers: {
                    'api-key': brevoApiKey,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Brevo success:', response.data.messageId);
            return { messageId: response.data.messageId };
        } catch (error) {
            console.error('❌ Brevo Error:', error.response?.data || error.message);
        }
    }

    // 2. Try Resend (Requires Custom Domain)
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
        }
    }

    console.log('--- MAIL SYSTEM ---');
    console.log('No HTTP API keys found. Falling back to SMTP (will timeout on Render Free).');

    // Fallback to SMTP
    const transporter = createTransporter();
    return await transporter.sendMail(options);
};

module.exports = {
    createTransporter,
    sendMail
};
